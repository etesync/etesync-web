import * as React from 'react';
import { Route, Switch } from 'react-router';

import * as EteSync from './api/EteSync';

import Container from './Container';

import Contact from './Contact';
import Event from './Event';
import PimMain from './PimMain';

import { routeResolver } from './App';

import { JournalsData, EntriesType, CredentialsData } from './store';

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
  }

  render() {
    const derived = this.props.etesync.encryptionKey;

    let syncEntriesCalendar: EteSync.SyncEntry[] = [];
    let syncEntriesAddressBook: EteSync.SyncEntry[] = [];
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
        syncEntriesAddressBook = syncEntriesAddressBook.concat(syncEntries);
      } else if (collectionInfo.type === 'CALENDAR') {
        syncEntriesCalendar = syncEntriesCalendar.concat(syncEntries);
      }

    }

    let addressBookItems = syncEntriesToItemMap(syncEntriesAddressBook);
    let calendarItems = syncEntriesToCalendarItemMap(syncEntriesCalendar);

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
          path={routeResolver.getRoute('pim.events._id')}
          exact={true}
          render={({match}) => (
            <Container>
              <Event event={calendarItems[match.params.eventUid]} />
            </Container>
          )}
        />
      </Switch>
    );
  }
}

export default Pim;
