import * as React from 'react';
import { connect } from 'react-redux';
import { Switch, Route, Redirect, withRouter } from 'react-router';
import Paper from 'material-ui/Paper';

import JournalList from './JournalList';
import JournalView from './JournalView';
import JournalFetcher from './JournalFetcher';
import LoginForm from './LoginForm';

import { routeResolver } from './App';
import { store, StoreState, CredentialsType, CredentialsData, fetchCredentials } from './store';

class EteSyncContext extends React.Component {
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
    if (this.props.credentials.fetching) {
      return (<div>Loading</div>);
    } else if (this.props.credentials.value === null) {
      const styles = {
        paper: {
          margin: 'auto',
          maxWidth: 400,
          padding: 20,
        },
      };

      return (
        <Paper zDepth={2} style={styles.paper}>
          <LoginForm onSubmit={this.onFormSubmit} error={this.props.credentials.error} />
        </Paper>
      );
    }

    let context = this.props.credentials.value as CredentialsData;

    return (
      <JournalFetcher etesync={context}>
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
      </JournalFetcher>
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
)(EteSyncContext));
