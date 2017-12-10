import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Paper from 'material-ui/Paper';

import SyncGate from './SyncGate';
import LoginForm from './LoginForm';

import { store, StoreState, CredentialsType, fetchCredentials } from './store';

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
      };

      return (
        <Paper zDepth={2} style={style.holder}>
          <LoginForm
            onSubmit={this.onFormSubmit}
            error={this.props.credentials.error}
            loading={this.props.credentials.fetching}
          />
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
