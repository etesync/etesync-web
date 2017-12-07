import * as React from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect, withRouter } from 'react-router';

import { routeResolver } from './App';

import LoadingIndicator from './LoadingIndicator';

import Journal from './Journal';
import Main from './Main';

import { store, JournalsType, EntriesType, fetchJournals, fetchEntries, StoreState, CredentialsData } from './store';

interface PropsType {
  etesync: CredentialsData;
}

interface PropsTypeInner extends PropsType {
  journals: JournalsType;
  entries: EntriesType;
}

class SyncGate extends React.Component {
  props: PropsTypeInner;

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    store.dispatch(fetchJournals(this.props.etesync));
  }

  componentWillReceiveProps(nextProps: PropsTypeInner) {
    if (nextProps.journals.value && (this.props.journals.value !== nextProps.journals.value)) {
      for (const journal of nextProps.journals.value) {
        let prevUid: string | null = null;
        const entries = this.props.entries[journal.uid];
        if (entries && entries.value && (entries.value.length > 0)) {
          prevUid = entries.value[entries.value.length - 1].uid;
        }

        store.dispatch(fetchEntries(this.props.etesync, journal.uid, prevUid));
      }
    }
  }

  render() {
    const entryArrays = Object.keys(this.props.entries).map((key) => {
      return this.props.entries[key].value;
    });

    const journals = this.props.journals.value;

    if ((journals === null) ||
      (entryArrays.length === 0) || !entryArrays.every((x: any) => (x !== null))) {
      return (<LoadingIndicator />);
    }

    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('home')}
          exact={true}
          render={({match}) => (
            <Redirect to={routeResolver.getRoute('pim')} />
          )}
        />
        <Route
          path={routeResolver.getRoute('pim')}
          render={({match}) => (
            <Main etesync={this.props.etesync} journals={journals} entries={this.props.entries} match={match} />
          )}
        />
        <Route
          path={routeResolver.getRoute('journals._id')}
          render={({match}) => (
            <Journal etesync={this.props.etesync} journals={journals} entries={this.props.entries} match={match} />
            )}
        />
      </Switch>
    );
  }
}

const mapStateToProps = (state: StoreState, props: PropsType) => {
  return {
    journals: state.cache.journals,
    entries: state.cache.entries,
  };
};

export default withRouter(connect(
  mapStateToProps
)(SyncGate));
