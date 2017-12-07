import * as React from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';

import * as EteSync from './api/EteSync';

import AddressBook from './AddressBook';
import Calendar from './Calendar';

import { JournalsData, EntriesType, CredentialsData } from './store';

import { syncEntriesToItemMap, syncEntriesToCalendarItemMap } from './journal-processors';

class Main extends React.Component {
  props: {
    etesync: CredentialsData;
    journals: JournalsData;
    entries: EntriesType;
    match: any;
  };

  constructor(props: any) {
    super(props);
    this.eventClicked = this.eventClicked.bind(this);
    this.contactClicked = this.contactClicked.bind(this);
  }

  eventClicked(contact: any) {
    // FIXME
  }

  contactClicked(contact: any) {
    // FIXME
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
      <Tabs>
        <Tab label="Address Book">
          <AddressBook entries={Array.from(addressBookItems.values())} onItemClick={this.contactClicked} />
        </Tab>
        <Tab label="Calendar">
          <Calendar entries={Array.from(calendarItems.values())} onItemClick={this.eventClicked} />
        </Tab>
      </Tabs>
    );
  }
}

export default Main;
