import * as React from 'react';

import * as EteSync from './api/EteSync';

const SERVICE_API = 'http://localhost:8000';
const USER = 'hacj';
const PASSWORD = 'hack';
const derived = EteSync.deriveKey(USER, PASSWORD);

export class JournalView extends React.Component {
  static defaultProps = {
    prevUid: null,
  };

  state: {
    entries: Array<EteSync.Entry>,
  };
  props: {
    match: any,
    prevUid: string | null,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      entries: [],
    };
  }

  componentDidMount() {
    const journal = this.props.match.params.journalUid;
    let authenticator = new EteSync.Authenticator(SERVICE_API);

    authenticator.getAuthToken(USER, PASSWORD).then((authToken) => {
      const credentials = new EteSync.Credentials(USER, authToken);

      let entryManager = new EteSync.EntryManager(credentials, SERVICE_API, journal);
      entryManager.list(this.props.prevUid).then((entries) => {
        this.setState({ entries });
      });
    });
  }

  render() {
    const journal = this.props.match.params.journalUid;
    let prevUid = this.props.prevUid;
    const journals = this.state.entries.map((entry) => {
      // FIXME: actually get the correct version!
      let cryptoManager = new EteSync.CryptoManager(derived, journal, 1);
      let syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
      prevUid = entry.uid;
      return (<li key={entry.uid}>{syncEntry.type}: {syncEntry.content}</li>);
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
