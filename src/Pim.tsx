import * as React from 'react';
import { Route, Switch } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import IconEdit from 'material-ui/svg-icons/editor/mode-edit';

import * as EteSync from './api/EteSync';

import { EventType } from './pim-types';

import Container from './Container';

import Contact from './Contact';
import EventEdit from './EventEdit';
import Event from './Event';
import PimMain from './PimMain';

import { routeResolver } from './App';

import { store, JournalsData, EntriesType, CredentialsData } from './store';

import { createJournalEntry } from './etesync-helpers';

import { syncEntriesToItemMap, syncEntriesToCalendarItemMap } from './journal-processors';

function objValues(obj: any) {
  return Object.keys(obj).map((x) => obj[x]);
}

class Pim extends React.Component {
  props: {
    etesync: CredentialsData;
    journals: JournalsData;
    entries: EntriesType;
    match: any;
  };

  constructor(props: any) {
    super(props);
    this.onEventSave = this.onEventSave.bind(this);
  }

  onEventSave(event: EventType, journalUid: string) {
    const journal = this.props.journals.find((x) => (x.uid === journalUid));

    if (journal === undefined) {
      return;
    }

    const entries = this.props.entries[journal.uid];

    if (entries.value === null) {
      return;
    }

    store.dispatch(createJournalEntry(this.props.etesync, journal, entries.value, event.toIcal()));
  }

  render() {
    const derived = this.props.etesync.encryptionKey;

    let collectionsCalendar: Array<EteSync.CollectionInfo> = [];
    let syncEntriesCalendar = [];
    let syncEntriesAddressBook = [];
    for (const journal of this.props.journals) {
      const journalEntries = this.props.entries[journal.uid];
      const cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);

      let prevUid: string | null = null;

      if (!journalEntries || !journalEntries.value) {
        continue;
      }

      // FIXME: Skip shared journals for now
      if (journal.key) {
        continue;
      }

      const collectionInfo = journal.getInfo(cryptoManager);

      const syncEntries = journalEntries.value.map((entry: EteSync.Entry) => {
        let syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
        prevUid = entry.uid;

        return syncEntry;
      });

      if (collectionInfo.type === 'ADDRESS_BOOK') {
        syncEntriesAddressBook.push(syncEntriesToItemMap(collectionInfo, syncEntries));
      } else if (collectionInfo.type === 'CALENDAR') {
        syncEntriesCalendar.push(syncEntriesToCalendarItemMap(collectionInfo, syncEntries));
        collectionsCalendar.push(collectionInfo);
      }

    }

    let addressBookItems = syncEntriesAddressBook.reduce((base, x) => Object.assign(base, x), {});
    let calendarItems = syncEntriesCalendar.reduce((base, x) => Object.assign(base, x), {});

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
          path={routeResolver.getRoute('pim.contacts._id')}
          exact={true}
          render={({match}) => (
            <Container>
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
