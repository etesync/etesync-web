import * as React from 'react';
import { Switch, Route } from 'react-router';

import { JournalList } from './JournalList';
import { JournalView } from './JournalView';

import * as EteSync from './api/EteSync';

import { routeResolver } from './App';

const SERVICE_API = 'http://localhost:8000';
const USER = 'me@etesync.com';
const PASSWORD = '';
const derived = EteSync.deriveKey(USER, PASSWORD);

export interface EteSyncContextType {
    serviceApiUrl: string;
    credentials: EteSync.Credentials;
    encryptionKey: string;
}

export class EteSyncContext extends React.Component {
  static state: EteSyncContextType;

  componentDidMount() {
    let authenticator = new EteSync.Authenticator(SERVICE_API);

    authenticator.getAuthToken(USER, PASSWORD).then((authToken) => {
      const credentials = new EteSync.Credentials(USER, authToken);

      const context = {
        serviceApiUrl: SERVICE_API,
        credentials,
        encryptionKey: derived,
      };

      this.setState(context);
    });
  }

  render() {
    if (this.state === null) {
      return (<div>loading</div>);
    }

    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('home')}
          exact={true}
          render={() => <JournalList etesync={this.state as EteSyncContextType} />}
        />
        <Route
          path={routeResolver.getRoute('journals._id')}
          exact={true}
          render={({match}) => <JournalView match={match} etesync={this.state as EteSyncContextType} />}
        />
      </Switch>
    );
  }
}
