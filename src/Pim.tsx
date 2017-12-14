import * as React from 'react';
import { Route, Switch } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import IconEdit from 'material-ui/svg-icons/editor/mode-edit';

import * as EteSync from './api/EteSync';

import { ContactType, EventType } from './pim-types';

import Container from './Container';

import ContactEdit from './ContactEdit';
import Contact from './Contact';
import EventEdit from './EventEdit';
import Event from './Event';
import PimMain from './PimMain';

import { routeResolver } from './App';

import { store, CredentialsData } from './store';

import { SyncInfo } from './SyncGate';

import { createJournalEntry } from './etesync-helpers';

import { syncEntriesToItemMap, syncEntriesToCalendarItemMap } from './journal-processors';

function objValues(obj: any) {
  return Object.keys(obj).map((x) => obj[x]);
}

class Pim extends React.PureComponent {
  props: {
    etesync: CredentialsData;
    syncInfo: SyncInfo;
    history: any;
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
    let collectionsAddressBook: Array<EteSync.CollectionInfo> = [];
    let collectionsCalendar: Array<EteSync.CollectionInfo> = [];
    let entriesAddressBook: Array<{[key: string]: ContactType}> = [];
    let entriesCalendar: Array<{[key: string]: EventType}> = [];
    this.props.syncInfo.forEach(
      (syncJournal) => {
        const syncEntries = syncJournal.entries;
        const journal = syncJournal.journal;

        // FIXME: Skip shared journals for now
        if (journal.key) {
          return;
        }

        const collectionInfo = syncJournal.collection;

        if (collectionInfo.type === 'ADDRESS_BOOK') {
          entriesAddressBook.push(syncEntriesToItemMap(collectionInfo, syncEntries));
          collectionsAddressBook.push(collectionInfo);
        } else if (collectionInfo.type === 'CALENDAR') {
          entriesCalendar.push(syncEntriesToCalendarItemMap(collectionInfo, syncEntries));
          collectionsCalendar.push(collectionInfo);
        }
      }
    );

    let addressBookItems = entriesAddressBook.reduce((base, x) => Object.assign(base, x), {});
    let calendarItems = entriesCalendar.reduce((base, x) => Object.assign(base, x), {});

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
                initialCollection={(addressBookItems[match.params.contactUid] as any).journalUid}
                contact={addressBookItems[match.params.contactUid]}
                collections={collectionsAddressBook}
                onSave={this.onContactSave}
              />
            </Container>
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.contacts._id')}
          exact={true}
          render={({match, history}) => (
            <Container>
              <div style={{textAlign: 'right'}}>
                <RaisedButton
                  label="Edit"
                  secondary={true}
                  icon={<IconEdit />}
                  onClick={() =>
                    history.push(routeResolver.getRoute(
                      'pim.contacts._id.edit',
                      {contactUid: match.params.contactUid}))
                  }
                />
              </div>
              <Contact contact={addressBookItems[match.params.contactUid]} />
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
                initialCollection={(calendarItems[match.params.eventUid] as any).journalUid}
                event={calendarItems[match.params.eventUid]}
                collections={collectionsCalendar}
                onSave={this.onEventSave}
              />
            </Container>
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.events._id')}
          exact={true}
          render={({match, history}) => (
            <Container>
              <div style={{textAlign: 'right'}}>
                <RaisedButton
                  label="Edit"
                  secondary={true}
                  icon={<IconEdit />}
                  onClick={() =>
                    history.push(routeResolver.getRoute(
                      'pim.events._id.edit',
                      {eventUid: match.params.eventUid}))
                  }
                />
              </div>
              <Event event={calendarItems[match.params.eventUid]} />
            </Container>
          )}
        />
      </Switch>
    );
  }
}

export default Pim;
