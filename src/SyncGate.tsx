import * as React from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect, withRouter } from 'react-router';

import { List, Map } from 'immutable';
import { createSelector } from 'reselect';

import { routeResolver } from './App';

import LoadingIndicator from './widgets/LoadingIndicator';
import PrettyError from './widgets/PrettyError';

import Journal from './Journal';
import Pim from './Pim';

import * as EteSync from './api/EteSync';
import { CURRENT_VERSION } from './api/Constants';

import { store, JournalsType, EntriesType, StoreState, CredentialsData, UserInfoType } from './store';
import { fetchAll, fetchUserInfo, createUserInfo } from './store/actions';

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
  userInfo: UserInfoType;
}

const syncInfoSelector = createSelector(
  (props: PropsTypeInner) => props.etesync,
  (props: PropsTypeInner) => props.journals.value as List<EteSync.Journal>,
  (props: PropsTypeInner) => props.entries,
  (props: PropsTypeInner) => props.userInfo.value!,
  (etesync, journals, entries, userInfo) => {
    const derived = etesync.encryptionKey;
    let asymmetricCryptoManager: EteSync.AsymmetricCryptoManager;
    return journals.reduce(
      (ret, journal) => {
        const journalEntries = entries.get(journal.uid);
        let prevUid: string | null = null;

        if (!journalEntries || !journalEntries.value) {
          return ret;
        }

        let cryptoManager: EteSync.CryptoManager;
        if (journal.key) {
          if (!asymmetricCryptoManager) {
            const keyPair = userInfo.getKeyPair(new EteSync.CryptoManager(derived, 'userInfo', userInfo.version));
            asymmetricCryptoManager = new EteSync.AsymmetricCryptoManager(keyPair);
          }
          const derivedJournalKey = asymmetricCryptoManager.decryptBytes(journal.key);
          cryptoManager = EteSync.CryptoManager.fromDerivedKey(derivedJournalKey, journal.version);
        } else {
          cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
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
    const me = this.props.etesync.credentials.email;
    const syncAll = () => {
      store.dispatch(fetchAll(this.props.etesync, this.props.entries));
    };

    const sync = () => {
      if (this.props.userInfo.value) {
        syncAll();
      } else {
        const userInfo = new EteSync.UserInfo(me, CURRENT_VERSION);
        const keyPair = EteSync.AsymmetricCryptoManager.generateKeyPair();
        const cryptoManager = new EteSync.CryptoManager(this.props.etesync.encryptionKey, 'userInfo');

        userInfo.setKeyPair(cryptoManager, keyPair);

        store.dispatch<any>(createUserInfo(this.props.etesync, userInfo)).then(syncAll);
      }
    };

    if (this.props.userInfo.value) {
      syncAll();
    } else {
      const fetching = store.dispatch(fetchUserInfo(this.props.etesync, me)) as any;
      fetching.then(sync);
    }
  }

  render() {
    const entryArrays = this.props.entries;
    const journals = this.props.journals.value;

    if (this.props.userInfo.error) {
      return <PrettyError error={this.props.userInfo.error} />;
    } else if (this.props.journals.error) {
      return <PrettyError error={this.props.journals.error} />;
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

    if ((this.props.userInfo.value === null) || (journals === null) ||
      (entryArrays.size === 0) ||
      !entryArrays.every((x: any) => (x.value !== null))) {
      return (<LoadingIndicator style={{display: 'block', margin: '40px auto'}} />);
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
              userInfo={this.props.userInfo.value!}
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
    userInfo: state.cache.userInfo,
  };
};

// FIXME: this and withRouters are only needed here because of https://github.com/ReactTraining/react-router/issues/5795
export default withRouter(connect(
  mapStateToProps
)(SyncGate));
