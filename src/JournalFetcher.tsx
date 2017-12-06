import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { store, JournalsType, fetchJournals, StoreState, CredentialsData } from './store';

interface PropsType {
  etesync: CredentialsData;
  children: any;
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
      return (<div/>);
    }

    return this.props.children;
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
