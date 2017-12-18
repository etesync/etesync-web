import * as React from 'react';
import { Route, Switch } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import IconEdit from 'material-ui/svg-icons/editor/mode-edit';
import IconChangeHistory from 'material-ui/svg-icons/action/change-history';

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
          path={routeResolver.getRoute('pim.contacts.new')}
          exact={true}
          render={({match}) => (
            <Container style={{maxWidth: 400}}>
              <ContactEdit collections={collectionsAddressBook} onSave={this.onContactSave} />
            </Container>
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.contacts._id.edit')}
          exact={true}
          render={({match}) => (
            <Container style={{maxWidth: 400}}>
              <ContactEdit
                initialCollection={(addressBookItems[match.params.itemUid] as any).journalUid}
                item={addressBookItems[match.params.itemUid]}
                collections={collectionsAddressBook}
                onSave={this.onContactSave}
              />
            </Container>
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.contacts._id.log')}
          exact={true}
          render={({match}) => (
            <Container>
              <ItemChangeLog
                syncInfo={this.props.syncInfo}
                items={addressBookItems}
                uid={match.params.itemUid}
              />
            </Container>
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.contacts._id')}
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
                      'pim.contacts._id.log',
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
                      'pim.contacts._id.edit',
                      {itemUid: match.params.itemUid}))
                  }
                />
              </div>
              <Contact item={addressBookItems[match.params.itemUid]} />
            </Container>
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.events.new')}
          exact={true}
          render={({match}) => (
            <Container style={{maxWidth: 400}}>
              <EventEdit collections={collectionsCalendar} onSave={this.onEventSave} />
            </Container>
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.events._id.edit')}
          exact={true}
          render={({match}) => (
            <Container style={{maxWidth: 400}}>
              <EventEdit
                initialCollection={(calendarItems[match.params.itemUid] as any).journalUid}
                item={calendarItems[match.params.itemUid]}
                collections={collectionsCalendar}
                onSave={this.onEventSave}
              />
            </Container>
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.events._id.log')}
          exact={true}
          render={({match}) => (
            <Container>
              <ItemChangeLog
                syncInfo={this.props.syncInfo}
                items={calendarItems}
                uid={match.params.itemUid}
              />
            </Container>
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.events._id')}
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
                      'pim.events._id.log',
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
                      'pim.events._id.edit',
                      {itemUid: match.params.itemUid}))
                  }
                />
              </div>
              <Event item={calendarItems[match.params.itemUid]} />
            </Container>
          )}
        />
      </Switch>
    );
  }
}

export default Pim;
