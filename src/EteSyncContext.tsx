import * as React from 'react';
import { Switch, Route } from 'react-router';

import { JournalList } from './JournalList';
import { JournalView } from './JournalView';

import * as EteSync from './api/EteSync';

import { routeResolver } from './App';

const SERVICE_API = 'http://localhost:8000';

const CONTEXT_SESSION_KEY = 'EteSyncContext';

enum LoadState {
  Initial = 'INIT',
  Working = 'WORKING',
  Done = 'DONE',
}

export interface EteSyncContextType {
    serviceApiUrl: string;
    credentials: EteSync.Credentials;
    encryptionKey: string;
}

export class EteSyncContext extends React.Component {
  username: HTMLInputElement;
  password: HTMLInputElement;
  encryptionPassword: HTMLInputElement;

  state: {
    context?: EteSyncContextType;
    loadState: LoadState;
    error?: Error;
  };

  constructor(props: any) {
    super(props);
    this.state = {loadState: LoadState.Initial};
    this.generateEncryption = this.generateEncryption.bind(this);

    const contextStr = sessionStorage.getItem(CONTEXT_SESSION_KEY);

    if (contextStr !== null) {
      const context: EteSyncContextType  = JSON.parse(contextStr);

      this.state = {
        loadState: LoadState.Done,
        context
      };
    }
  }

  generateEncryption() {
    let authenticator = new EteSync.Authenticator(SERVICE_API);

    this.setState({
      loadState: LoadState.Working
    });

    const username = this.username.value;
    const password = this.password.value;
    const encryptionPassword = this.encryptionPassword.value;

    authenticator.getAuthToken(username, password).then((authToken) => {
      const credentials = new EteSync.Credentials(username, authToken);
      const derived = EteSync.deriveKey(username, encryptionPassword);

      const context = {
        serviceApiUrl: SERVICE_API,
        credentials,
        encryptionKey: derived,
      };

      sessionStorage.setItem(CONTEXT_SESSION_KEY, JSON.stringify(context));

      this.setState({
        loadState: LoadState.Done,
        context
      });
    }).catch((error) => {
      this.setState({
        loadState: LoadState.Initial,
        error
      });
    });
  }

  render() {
    if (this.state.loadState === LoadState.Initial) {
      return (
        <div>
          {(this.state.error !== undefined) && (<div>Error! {this.state.error.message}</div>)}
          <form onSubmit={this.generateEncryption}>
            <input type="text" placeholder="Username" ref={(input) => this.username = input as HTMLInputElement} />
            <input type="password" placeholder="Password" ref={(input) => this.password = input as HTMLInputElement} />
            <input
              type="password"
              placeholder="Encryption Password"
              ref={(input) => this.encryptionPassword = input as HTMLInputElement}
            />
            <button>Submit</button>
          </form>
        </div>
      );
    } else if ((this.state.context === undefined) ||
      (this.state.loadState === LoadState.Working)) {
      return (<div>loading</div>);
    }

    let context: EteSyncContextType = this.state.context;

    return (
      <div>
        <div className="App-header">
          <h2>Welcome to React</h2>
        </div>
        <Switch>
          <Route
            path={routeResolver.getRoute('home')}
            exact={true}
            render={() => <JournalList etesync={context} />}
          />
          <Route
            path={routeResolver.getRoute('journals._id')}
            render={({match}) => <JournalView match={match} etesync={context} />}
          />
        </Switch>
      </div>
    );
  }
}
