import * as React from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect, withRouter } from 'react-router';

import { List, Map } from 'immutable';
import { createSelector } from 'reselect';

import { routeResolver } from './App';

import LoadingIndicator from './widgets/LoadingIndicator';

import Journal from './Journal';
import Pim from './Pim';

import * as EteSync from './api/EteSync';

import { store, JournalsType, EntriesType, StoreState, CredentialsData } from './store';
import { fetchJournals, fetchEntries } from './store/actions';

export interface SyncInfoJournal {
  journal: EteSync.Journal;
  journalEntries: List<EteSync.Entry>;
  collection: EteSync.CollectionInfo;
  entries: List<EteSync.SyncEntry>;
}

export type SyncInfo = Map<string, SyncInfoJournal>;

interface PropsType {
  etesync: CredentialsData;
}

interface PropsTypeInner extends PropsType {
  journals: JournalsType;
  entries: EntriesType;
}

const syncInfoSelector = createSelector(
  (props: PropsTypeInner) => props.etesync,
  (props: PropsTypeInner) => props.journals.value as List<EteSync.Journal>,
  (props: PropsTypeInner) => props.entries,
  (etesync, journals, entries) => {
    return journals.reduce(
      (ret, journal) => {
        const derived = etesync.encryptionKey;
        const journalEntries = entries.get(journal.uid);
        const cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);

        let prevUid: string | null = null;

        if (!journalEntries || !journalEntries.value) {
          return ret;
        }

        // FIXME: Skip shared journals for now
        if (journal.key) {
          return ret;
        }

        const collectionInfo = journal.getInfo(cryptoManager);

        const syncEntries = journalEntries.value.map((entry: EteSync.Entry) => {
          let syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
          prevUid = entry.uid;

          return syncEntry;
        });

        return ret.set(journal.uid, {
          entries: syncEntries,
          collection: collectionInfo,
          journal,
          journalEntries: journalEntries.value,
        });
      },
      Map<string, SyncInfoJournal>()
    );
  },
);

const PimRouter = withRouter(Pim);
const JournalRouter = withRouter(Journal);

class SyncGate extends React.PureComponent {
  props: PropsTypeInner;

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    store.dispatch(fetchJournals(this.props.etesync));
  }

  componentWillReceiveProps(nextProps: PropsTypeInner) {
    if (nextProps.journals.value && (this.props.journals.value !== nextProps.journals.value)) {
      nextProps.journals.value.forEach((journal) => {
        let prevUid: string | null = null;
        const entries = this.props.entries.get(journal.uid);
        if (entries && entries.value) {
          const last = entries.value.last();
          prevUid = (last) ? last.uid : null;
        }

        store.dispatch(fetchEntries(this.props.etesync, journal.uid, prevUid));
      });
    }
  }

  render() {
    const entryArrays = this.props.entries;
    const journals = this.props.journals.value;

    if (this.props.journals.error) {
      return this.props.journals.error.toString();
    } else {
      let errors: Array<{journal: string, error: Error}> = [];
      this.props.entries.forEach((entry, journal) => {
        if (entry.error) {
          errors.push({journal, error: entry.error});
        }
      });

      if (errors.length > 0) {
        return (
          <ul>
            {errors.map((error) => (<li>{error.journal}: {error.error.toString()}</li>))}
          </ul>
        );
      }
    }

    if ((journals === null) ||
      (entryArrays.size === 0) ||
      !entryArrays.every((x: any) => (x.value !== null))) {
      return (<LoadingIndicator />);
    }

    const journalMap = syncInfoSelector(this.props);

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
          render={({match, history}) => (
            <PimRouter
              etesync={this.props.etesync}
              syncInfo={journalMap}
              history={history}
            />
          )}
        />
        <Route
          path={routeResolver.getRoute('journals._id')}
          render={({match}) => (
            <JournalRouter
              syncInfo={journalMap}
              match={match}
            />
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

// FIXME: this and withRouters are only needed here because of https://github.com/ReactTraining/react-router/issues/5795
export default withRouter(connect(
  mapStateToProps
)(SyncGate));
