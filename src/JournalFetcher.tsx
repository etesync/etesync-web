import * as React from 'react';
import { connect } from 'react-redux';
import { Switch, Route, Redirect, withRouter } from 'react-router';
import LoadingIndicator from './LoadingIndicator';

import JournalList from './JournalList';
import Journal from './Journal';

import { routeResolver } from './App';

import { store, JournalsType, fetchJournals, StoreState, CredentialsData } from './store';

interface PropsType {
  etesync: CredentialsData;
}

interface PropsTypeInner extends PropsType {
  journals: JournalsType;
}

class JournalFetcher extends React.Component {
  props: PropsTypeInner;

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    store.dispatch(fetchJournals(this.props.etesync));
  }

  render() {
    if (this.props.journals.value === null) {
      return (<LoadingIndicator />);
    }

    const journals = this.props.journals.value;

    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('home')}
          exact={true}
          render={() => <Redirect to={routeResolver.getRoute('journals')} />}
        />
        <Route
          path={routeResolver.getRoute('journals')}
          exact={true}
          render={() => <JournalList etesync={this.props.etesync} journals={journals} />}
        />
        <Route
          path={routeResolver.getRoute('journals._id')}
          render={({match}) => <Journal match={match} etesync={this.props.etesync} journals={journals} />}
        />
      </Switch>
    );
  }
}

const mapStateToProps = (state: StoreState, props: PropsType) => {
  return {
    journals: state.cache.journals,
  };
};

export default withRouter(connect(
  mapStateToProps
)(JournalFetcher));
