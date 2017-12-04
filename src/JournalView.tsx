import * as React from 'react';
import { Route, Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import { Tabs, Tab } from 'material-ui/Tabs';

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
      <div>
        <Tabs>
          <Tab
            label={itemsTitle}
            containerElement={<Link to={routeResolver.getRoute('journals._id.items', {journalUid: journal.uid})} />}
          />
          <Tab
            label="Journal Entries"
            containerElement={<Link to={routeResolver.getRoute('journals._id.entries', {journalUid: journal.uid})} />}
          />
        </Tabs>
        <Route
          path={routeResolver.getRoute('journals._id')}
          exact={true}
          render={() => <Redirect to={routeResolver.getRoute('journals._id.items', {journalUid: journal.uid})} />}
        />
        <h2>{collectionInfo.displayName}</h2>
        <Route
          path={routeResolver.getRoute('journals._id.entries')}
          render={() => {
              return <JournalViewEntries journal={journal} entries={syncEntries} />;
            }
          }
        />
        <Route
          path={routeResolver.getRoute('journals._id.items')}
          render={() => {
              return itemsView;
            }
          }
        />
      </div>
    );
  }
}
