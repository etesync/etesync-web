import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Tabs, Tab } from 'material-ui/Tabs';

import LoadingIndicator from './LoadingIndicator';

import * as EteSync from './api/EteSync';

import AddressBook from './AddressBook';
import Calendar from './Calendar';

import { store, JournalsType, EntriesType, fetchJournals, fetchEntries, StoreState, CredentialsData } from './store';

import { syncEntriesToItemMap, syncEntriesToCalendarItemMap } from './journal-processors';

interface PropsType {
  etesync: CredentialsData;
}

interface PropsTypeInner extends PropsType {
  journals: JournalsType;
  entries: EntriesType;
}

class SyncGate extends React.Component {
  props: PropsTypeInner;

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

  componentDidMount() {
    store.dispatch(fetchJournals(this.props.etesync));
  }

  componentWillReceiveProps(nextProps: PropsTypeInner) {
    if (nextProps.journals.value && (this.props.journals.value !== nextProps.journals.value)) {
      for (const journal of nextProps.journals.value) {
        store.dispatch(fetchEntries(this.props.etesync, journal.uid, null));
      }
    }
  }

  render() {
    const entryArrays = Object.keys(this.props.entries).map((key) => {
      return this.props.entries[key].value;
    });

    if ((this.props.journals.value === null) ||
      (entryArrays.length === 0) || !entryArrays.every((x: any) => (x !== null))) {
      return (<LoadingIndicator />);
    }

    const derived = this.props.etesync.encryptionKey;

    let syncEntriesCalendar: EteSync.SyncEntry[] = [];
    let syncEntriesAddressBook: EteSync.SyncEntry[] = [];
    for (const journal of this.props.journals.value) {
      const journalEntries = this.props.entries[journal.uid].value;
      const cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);

      let prevUid: string | null = null;

      if (!journalEntries) {
        continue;
      }

      // FIXME: Skip shared journals for now
      if (journal.key) {
        continue;
      }

      const collectionInfo = journal.getInfo(cryptoManager);

      const syncEntries = journalEntries.map((entry) => {
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

const mapStateToProps = (state: StoreState, props: PropsType) => {
  return {
    journals: state.cache.journals,
    entries: state.cache.entries,
  };
};

export default withRouter(connect(
  mapStateToProps
)(SyncGate));
