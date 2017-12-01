import * as React from 'react';

import * as EteSync from './api/EteSync';

const SERVICE_API = 'http://localhost:8000';
const USER = 'test@localhost';
const PASSWORD = 'SomePassword';
const derived = EteSync.deriveKey(USER, PASSWORD);

export class JournalList extends React.Component {
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
    let authenticator = new EteSync.Authenticator(SERVICE_API);

    authenticator.getAuthToken(USER, PASSWORD).then((authToken) => {
      const credentials = new EteSync.Credentials(USER, authToken);

      let journalManager = new EteSync.JournalManager(credentials, SERVICE_API);
      journalManager.list().then((journals) => {
        journals = journals.filter((x) => (
          // Skip shared journals for now.
          !x.key
        ));
        this.setState({ journals });
      });
    });
  }

  render() {
    const journals = this.state.journals.map((journal, idx) => {
      let cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
      let info = journal.getInfo(cryptoManager);
      return (<li key={journal.uid}>{info.displayName}: {info.type} ({journal.uid})</li>);
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
