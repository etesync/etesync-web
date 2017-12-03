import * as React from 'react';
import { Route, Redirect } from 'react-router';

import { EteSyncContextType } from './EteSyncContext';
import * as EteSync from './api/EteSync';

import { routeResolver } from './App';

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
      this.setState(Object.assign({}, this.state, { journal: journalInstance }));
    });

    let entryManager = new EteSync.EntryManager(credentials, apiBase, journal);
    entryManager.list(this.props.prevUid || null).then((entries) => {
      this.setState(Object.assign({}, this.state, { entries }));
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

    return (
      <div>
        <Route
          path={routeResolver.getRoute('journals._id')}
          exact={true}
          render={() => <Redirect to={routeResolver.getRoute('journals._id.entries', {journalUid: journal.uid})} />}
        />
        <h2>Welcome to Journal!</h2>
        <Route
          path={routeResolver.getRoute('journals._id.entries')}
          render={() =>
            <JournalViewEntries journal={journal} entries={syncEntries} />
          }
        />
        <Route
          path={routeResolver.getRoute('journals._id.items')}
          render={() => {
              if (collectionInfo.type === 'CALENDAR') {
                return <JournalViewCalendar journal={journal} entries={syncEntries} />;
              } else if (collectionInfo.type === 'ADDRESS_BOOK') {
                return <JournalViewAddressBook journal={journal} entries={syncEntries} />;
              } else {
                return <div>Unsupported type</div>;
              }
            }
          }
        />
      </div>
    );
  }
}
