import * as React from 'react';
import { Switch, Route, Redirect } from 'react-router';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';

import { JournalList } from './JournalList';
import { JournalView } from './JournalView';

import * as EteSync from './api/EteSync';

import { routeResolver, getPalette } from './App';

import * as C from './Constants';

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
  server: TextField;
  username: TextField;
  password: TextField;
  encryptionPassword: TextField;

  state: {
    context?: EteSyncContextType;
    loadState: LoadState;
    showAdvanced?: boolean;
    error?: Error;
  };

  constructor(props: any) {
    super(props);
    this.state = {loadState: LoadState.Initial};
    this.generateEncryption = this.generateEncryption.bind(this);
    this.toggleAdvancedSettings = this.toggleAdvancedSettings.bind(this);

    const contextStr = sessionStorage.getItem(CONTEXT_SESSION_KEY);

    if (contextStr !== null) {
      const context: EteSyncContextType  = JSON.parse(contextStr);

      this.state = {
        loadState: LoadState.Done,
        context
      };
    }
  }

  generateEncryption(e: any) {
    e.preventDefault();
    const server = this.state.showAdvanced ? this.server.getValue() : C.serviceApiBase;

    let authenticator = new EteSync.Authenticator(server);

    this.setState({
      loadState: LoadState.Working
    });

    const username = this.username.getValue();
    const password = this.password.getValue();
    const encryptionPassword = this.encryptionPassword.getValue();

    authenticator.getAuthToken(username, password).then((authToken) => {
      const credentials = new EteSync.Credentials(username, authToken);
      const derived = EteSync.deriveKey(username, encryptionPassword);

      const context = {
        serviceApiUrl: server,
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

  toggleAdvancedSettings() {
    this.setState(Object.assign(
      {}, this.state,
      {showAdvanced: !this.state.showAdvanced}));
  }

  render() {
    if (this.state.loadState === LoadState.Initial) {
      let advancedSettings = null;
      if (this.state.showAdvanced) {
        advancedSettings = (
            <div>
              <TextField
                type="text"
                floatingLabelText="Server"
                ref={(input) => this.server = input as TextField}
              />
              <br />
            </div>
        );
      }

      const styles = {
        holder: {
          margin: 'auto',
          maxWidth: 400,
          padding: 20,
        },
        paper: {
          padding: 20,
        },
        form: {
        },
        forgotPassword: {
          color: getPalette('accent1Color'),
          paddingTop: 20,
        },
        advancedSettings: {
          marginTop: 20,
        },
        submit: {
          marginTop: 40,
          textAlign: 'right',
        },
      };

      return (
        <div style={styles.holder}>
          <Paper zDepth={2} style={styles.paper}>
            {(this.state.error !== undefined) && (<div>Error! {this.state.error.message}</div>)}
            <h2>Please Log In</h2>
            <form style={styles.form} onSubmit={this.generateEncryption}>
              <TextField
                type="text"
                floatingLabelText="Email"
                ref={(input) => this.username = input as TextField}
              />
              <TextField
                type="password"
                floatingLabelText="Password"
                ref={(input) => this.password = input as TextField}
              />
              <div style={styles.forgotPassword}>
                <a href={C.forgotPassword}>Forgot password?</a>
              </div>
              <TextField
                type="password"
                floatingLabelText="Encryption Password"
                ref={(input) => this.encryptionPassword = input as TextField}
              />
              <Toggle
                label="Advanced settings"
                style={styles.advancedSettings}
                toggled={this.state.showAdvanced}
                onToggle={this.toggleAdvancedSettings}
              />
              {advancedSettings}
              <div style={styles.submit}>
                <RaisedButton type="submit" label="Log In" secondary={true} />
              </div>
            </form>
          </Paper>
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
            render={() => <Redirect to={routeResolver.getRoute('journals')} />}
          />
          <Route
            path={routeResolver.getRoute('journals')}
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
