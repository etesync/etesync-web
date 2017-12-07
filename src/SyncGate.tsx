import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import LoadingIndicator from './LoadingIndicator';

import * as EteSync from './api/EteSync';

import AddressBook from './AddressBook';

import { store, JournalsType, EntriesType, fetchJournals, fetchEntries, StoreState, CredentialsData } from './store';

import { syncEntriesToItemMap } from './journal-processors';

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
    this.contactClicked = this.contactClicked.bind(this);
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

    let syncEntries: EteSync.SyncEntry[] = [];
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

      if (collectionInfo.type !== 'ADDRESS_BOOK') {
        continue;
      }

      syncEntries = syncEntries.concat(journalEntries.map((entry) => {
        let syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
        prevUid = entry.uid;

        return syncEntry;
      }));

    }

    let items = syncEntriesToItemMap(syncEntries);

    return (
      <AddressBook entries={Array.from(items.values())} onItemClick={this.contactClicked} />
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
