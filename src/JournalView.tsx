import * as React from 'react';
const Fragment = (React as any).Fragment;
import { Tabs, Tab } from 'material-ui/Tabs';

import { EteSyncContextType } from './EteSyncContext';
import * as EteSync from './api/EteSync';

import { JournalViewEntries } from './JournalViewEntries';
import { JournalViewAddressBook } from './JournalViewAddressBook';
import { JournalViewCalendar } from './JournalViewCalendar';

export class JournalView extends React.Component {
  static defaultProps = {
    prevUid: null,
  };

  state: {
    journal?: EteSync.Journal,
    entries: Array<EteSync.Entry>,
  };
  props: {
    etesync: EteSyncContextType
    match: any,
    prevUid?: string | null,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      entries: [],
    };
  }

  componentDidMount() {
    const credentials = this.props.etesync.credentials;
    const apiBase = this.props.etesync.serviceApiUrl;
    const journal = this.props.match.params.journalUid;

    let journalManager = new EteSync.JournalManager(credentials, apiBase);
    journalManager.fetch(journal).then((journalInstance) => {
      this.setState({ journal: journalInstance });
    });

    let entryManager = new EteSync.EntryManager(credentials, apiBase, journal);
    entryManager.list(this.props.prevUid || null).then((entries) => {
      this.setState({ entries });
    });
  }

  render() {
    if (this.state.journal === undefined) {
      return (<div>Loading</div>);
    }

    const derived = this.props.etesync.encryptionKey;
    const journal = this.state.journal;
    let prevUid = this.props.prevUid || null;
    const cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
    const collectionInfo = journal.getInfo(cryptoManager);

    const syncEntries = this.state.entries.map((entry) => {
      let syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
      prevUid = entry.uid;

      return syncEntry;
    });

    let itemsTitle: string;
    let itemsView: JSX.Element;
    if (collectionInfo.type === 'CALENDAR') {
      itemsView = <JournalViewCalendar journal={journal} entries={syncEntries} />;
      itemsTitle = 'Events';
    } else if (collectionInfo.type === 'ADDRESS_BOOK') {
      itemsView = <JournalViewAddressBook journal={journal} entries={syncEntries} />;
      itemsTitle = 'Contacts';
    } else {
      itemsView = <div>Unsupported type</div>;
      itemsTitle = 'Items';
    }

    return (
      <Fragment>
        <Tabs>
          <Tab
            label={itemsTitle}
          >
              <h2>{collectionInfo.displayName}</h2>
              {itemsView}
          </Tab>
          <Tab
            label="Journal Entries"
          >
              <h2>{collectionInfo.displayName}</h2>
              <JournalViewEntries journal={journal} entries={syncEntries} />;
          </Tab>
        </Tabs>
      </Fragment>
    );
  }
}
