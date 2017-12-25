import * as React from 'react';
import { Route, Switch } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import IconEdit from 'material-ui/svg-icons/editor/mode-edit';
import IconChangeHistory from 'material-ui/svg-icons/action/change-history';

import { withRouter } from 'react-router';

import * as EteSync from '../api/EteSync';

import { createSelector } from 'reselect';
import { pure } from 'recompose';

import { History } from 'history';

import { ContactType, EventType } from '../pim-types';

import Container from '../widgets/Container';

import JournalEntries from '../components/JournalEntries';
import ContactEdit from '../components/ContactEdit';
import Contact from '../components/Contact';
import EventEdit from '../components/EventEdit';
import Event from '../components/Event';
import PimMain from './PimMain';

import { routeResolver } from '../App';

import { store, CredentialsData } from '../store';

import { SyncInfo } from '../SyncGate';

import { createJournalEntry } from '../etesync-helpers';

import { syncEntriesToItemMap, syncEntriesToCalendarItemMap } from '../journal-processors';

function objValues(obj: any) {
  return Object.keys(obj).map((x) => obj[x]);
}

const itemsSelector = createSelector(
  (props: {syncInfo: SyncInfo}) => props.syncInfo,
  (syncInfo) => {
    let collectionsAddressBook: Array<EteSync.CollectionInfo> = [];
    let collectionsCalendar: Array<EteSync.CollectionInfo> = [];
    let addressBookItems: {[key: string]: ContactType} = {};
    let calendarItems: {[key: string]: EventType} = {};
    syncInfo.forEach(
      (syncJournal) => {
        const syncEntries = syncJournal.entries;
        const journal = syncJournal.journal;

        // FIXME: Skip shared journals for now
        if (journal.key) {
          return;
        }

        const collectionInfo = syncJournal.collection;

        if (collectionInfo.type === 'ADDRESS_BOOK') {
          addressBookItems = syncEntriesToItemMap(collectionInfo, syncEntries, addressBookItems);
          collectionsAddressBook.push(collectionInfo);
        } else if (collectionInfo.type === 'CALENDAR') {
          calendarItems = syncEntriesToCalendarItemMap(collectionInfo, syncEntries, calendarItems);
          collectionsCalendar.push(collectionInfo);
        }
      }
    );

    return { collectionsAddressBook, collectionsCalendar, addressBookItems, calendarItems };
  },
);

const ItemChangeLog = pure((props: any) => {
  const {
    syncInfo,
    items,
    uid,
  } = props;

  const journalItem = syncInfo.get((items[uid] as any).journalUid);

  return (
    <React.Fragment>
      <h2>Item Change History</h2>
      <JournalEntries
        journal={journalItem.journal}
        entries={journalItem.entries}
        uid={uid}
      />
    </React.Fragment>
  );
});

const CollectionRoutes = withRouter(
  class CollectionRoutesInner extends React.PureComponent {
    props: {
      syncInfo: SyncInfo,
      routePrefix: string,
      collections: Array<EteSync.CollectionInfo>,
      componentEdit: any,
      componentView: any,
      items: {[key: string]: any},
      onItemSave: (item: Object, journalUid: string, originalContact?: Object) => void;
      onItemCancel: () => void;
    };

    render() {
      const props = this.props;
      const ComponentEdit = props.componentEdit;
      const ComponentView = props.componentView;

      return (
        <Switch>
          <Route
            path={routeResolver.getRoute(props.routePrefix + '.new')}
            exact={true}
            render={({match}) => (
              <Container style={{maxWidth: 400}}>
                <ComponentEdit collections={props.collections} onSave={props.onItemSave} />
              </Container>
            )}
          />
          <Route
            path={routeResolver.getRoute(props.routePrefix + '._id.edit')}
            exact={true}
            render={({match}) => (
              <Container style={{maxWidth: 400}}>
                <ComponentEdit
                  initialCollection={(props.items[match.params.itemUid] as any).journalUid}
                  item={props.items[match.params.itemUid]}
                  collections={props.collections}
                  onSave={props.onItemSave}
                  onCancel={props.onItemCancel}
                />
              </Container>
            )}
          />
          <Route
            path={routeResolver.getRoute(props.routePrefix + '._id.log')}
            exact={true}
            render={({match}) => (
              <Container>
                <ItemChangeLog
                  syncInfo={props.syncInfo}
                  items={props.items}
                  uid={match.params.itemUid}
                />
              </Container>
            )}
          />
          <Route
            path={routeResolver.getRoute(props.routePrefix + '._id')}
            exact={true}
            render={({match, history}) => (
              <Container>
                <div style={{textAlign: 'right', marginBottom: 15}}>
                  <RaisedButton
                    label="Change History"
                    style={{marginLeft: 15}}
                    icon={<IconChangeHistory />}
                    onClick={() =>
                      history.push(routeResolver.getRoute(
                        props.routePrefix + '._id.log',
                        {itemUid: match.params.itemUid}))
                    }
                  />

                  <RaisedButton
                    label="Edit"
                    secondary={true}
                    style={{marginLeft: 15}}
                    icon={<IconEdit />}
                    onClick={() =>
                      history.push(routeResolver.getRoute(
                        props.routePrefix + '._id.edit',
                        {itemUid: match.params.itemUid}))
                    }
                  />
                </div>
                <ComponentView item={props.items[match.params.itemUid]} />
              </Container>
            )}
          />
        </Switch>
      );
    }
  }
);

class Pim extends React.PureComponent {
  props: {
    etesync: CredentialsData;
    syncInfo: SyncInfo;
    history: History;
  };

  constructor(props: any) {
    super(props);
    this.onEventSave = this.onEventSave.bind(this);
    this.onContactSave = this.onContactSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  onEventSave(event: EventType, journalUid: string, originalEvent?: EventType) {
    const syncJournal = this.props.syncInfo.get(journalUid);

    if (syncJournal === undefined) {
      return;
    }

    const journal = syncJournal.journal;

    let action = (originalEvent === undefined) ? EteSync.SyncEntryAction.Add : EteSync.SyncEntryAction.Change;
    let saveEvent = store.dispatch(
      createJournalEntry(this.props.etesync, journal, syncJournal.journalEntries, action, event.toIcal()));
    (saveEvent as any).then(() => {
      this.props.history.goBack();
    });
  }

  onContactSave(contact: ContactType, journalUid: string, originalContact?: ContactType) {
    const syncJournal = this.props.syncInfo.get(journalUid);

    if (syncJournal === undefined) {
      return;
    }

    const journal = syncJournal.journal;

    let action = (originalContact === undefined) ? EteSync.SyncEntryAction.Add : EteSync.SyncEntryAction.Change;
    let saveContact = store.dispatch(
      createJournalEntry(this.props.etesync, journal, syncJournal.journalEntries, action, contact.toIcal()));
    (saveContact as any).then(() => {
      this.props.history.goBack();
    });
  }

  onCancel() {
    this.props.history.goBack();
  }

  render() {
    const { collectionsAddressBook, collectionsCalendar, addressBookItems, calendarItems } = itemsSelector(this.props);

    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('pim')}
          exact={true}
          render={({history}) => (
            <PimMain
              contacts={objValues(addressBookItems)}
              events={objValues(calendarItems)}
              history={history}
            />
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.contacts')}
          render={() => (
            <CollectionRoutes
              syncInfo={this.props.syncInfo}
              routePrefix="pim.contacts"
              collections={collectionsAddressBook}
              items={addressBookItems}
              componentEdit={ContactEdit}
              componentView={Contact}
              onItemSave={this.onContactSave}
              onItemCancel={this.onCancel}
            />
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.events')}
          render={() => (
            <CollectionRoutes
              syncInfo={this.props.syncInfo}
              routePrefix="pim.events"
              collections={collectionsCalendar}
              items={calendarItems}
              componentEdit={EventEdit}
              componentView={Event}
              onItemSave={this.onEventSave}
              onItemCancel={this.onCancel}
            />
          )}
        />
      </Switch>
    );
  }
}

export default Pim;
