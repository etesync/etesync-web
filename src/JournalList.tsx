import * as React from 'react';
import { Link } from 'react-router-dom';

import { EteSyncContextType } from './EteSyncContext';
import * as EteSync from './api/EteSync';

import { routeResolver } from './App';

export class JournalList extends React.Component {
  props: {
    etesync: EteSyncContextType
  };

  state: {
    journals: Array<EteSync.Journal>,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      journals: [],
    };
  }

  componentDidMount() {
    const credentials = this.props.etesync.credentials;
    const apiBase = this.props.etesync.serviceApiUrl;

    let journalManager = new EteSync.JournalManager(credentials, apiBase);
    journalManager.list().then((journals) => {
      journals = journals.filter((x) => (
        // Skip shared journals for now.
        !x.key
      ));
      this.setState({ journals });
    });
  }

  render() {
    const derived = this.props.etesync.encryptionKey;
    const journals = this.state.journals.map((journal, idx) => {
      let cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
      let info = journal.getInfo(cryptoManager);
      return (
        <li key={journal.uid}>
          <Link
            to={routeResolver.getRoute('journals._id', { journalUid: journal.uid })}
            className="Drawer-navlink"
          >
            {info.displayName}: {info.type} ({journal.uid})
          </Link>
          </li>
      );
    });

    return (
      <div>
        <div className="App-header">
          <h2>Welcome to React</h2>
        </div>
        <ul>
          {journals}
        </ul>
      </div>
    );
  }
}
