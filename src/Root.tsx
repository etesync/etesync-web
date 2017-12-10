import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Paper from 'material-ui/Paper';

import SyncGate from './SyncGate';
import LoginForm from './LoginForm';

import { store, StoreState, CredentialsType, fetchCredentials } from './store';

import * as C from './Constants';

class Root extends React.Component {
  props: {
    credentials: CredentialsType;
  };

  constructor(props: any) {
    super(props);
    this.onFormSubmit = this.onFormSubmit.bind(this);
  }

  onFormSubmit(username: string, password: string, encryptionPassword: string, serviceApiUrl: string) {
    store.dispatch(fetchCredentials(username, password, encryptionPassword, serviceApiUrl));
  }

  render() {
    if (this.props.credentials.value === null) {
      const style = {
        holder: {
          margin: 'auto',
          maxWidth: 400,
          padding: 20,
        },
        isSafe: {
          marginTop: 20,
          textDecoration: 'none',
        },
      };

      return (
        <Paper zDepth={2} style={style.holder}>
          <h2>Please Log In</h2>
          <LoginForm
            onSubmit={this.onFormSubmit}
            error={this.props.credentials.error}
            loading={this.props.credentials.fetching}
          />
          <div style={style.isSafe}>
            <a style={style.isSafe} href={C.faq + '#web-client'}>Is the web client safe to use?</a>
          </div>
        </Paper>
      );
    }

    return (
      <SyncGate etesync={this.props.credentials.value} />
    );
  }
}

const mapStateToProps = (state: StoreState) => {
  return {
    credentials: state.credentials,
  };
};

export default withRouter(connect(
  mapStateToProps
)(Root));
