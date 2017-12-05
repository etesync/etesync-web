import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { EteSyncContextType } from './EteSyncContext';
import * as EteSync from './api/EteSync';

import * as store from './store';

interface PropsType {
  etesync: EteSyncContextType;
  children: any;
}

interface PropsTypeInner extends PropsType {
  journals: store.JournalsType;
}

function fetchJournals(etesync: EteSyncContextType) {
  const credentials = etesync.credentials;
  const apiBase = etesync.serviceApiUrl;

  return (dispatch: any) => {
    dispatch(store.journalsRequest());

    let journalManager = new EteSync.JournalManager(credentials, apiBase);
    journalManager.list().then(
      (journals) => {
        dispatch(store.journalsSuccess(journals));
      },
      (error) => {
        dispatch(store.journalsFailure(error));
      }
    );
  };
}

class JournalFetcher extends React.Component {
  props: PropsTypeInner;

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    store.store.dispatch(fetchJournals(this.props.etesync));
  }

  render() {
    if (this.props.journals.value === null) {
      return (<div/>);
    }

    return this.props.children;
  }
}

const mapStateToProps = (state: store.StoreState, props: PropsType) => {
  return {
    journals: state.cache.journals,
  };
};

export default withRouter(connect(
  mapStateToProps
)(JournalFetcher));
