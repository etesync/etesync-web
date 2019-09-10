import * as React from 'react';
import { connect } from 'react-redux';
import { Action } from 'redux-actions';
import { Route, Switch, Redirect, RouteComponentProps, withRouter } from 'react-router';

import * as moment from 'moment';
import 'moment/locale/en-gb';

import { List, Map } from 'immutable';
import { createSelector } from 'reselect';

import { routeResolver } from './App';

import AppBarOverride from './widgets/AppBarOverride';
import LoadingIndicator from './widgets/LoadingIndicator';
import PrettyError from './widgets/PrettyError';

import Journals from './Journals';
import Settings from './Settings';
import Pim from './Pim';

import * as EteSync from './api/EteSync';
import { CURRENT_VERSION } from './api/Constants';

import { store, SettingsType, JournalsType, EntriesType, StoreState, CredentialsData, UserInfoType } from './store';
import { addJournal, fetchAll, fetchEntries, fetchUserInfo, createUserInfo } from './store/actions';

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

type PropsTypeInner = RouteComponentProps<{}> & PropsType & {
  settings: SettingsType;
  journals: JournalsType;
  entries: EntriesType;
  userInfo: UserInfoType;
  fetchCount: number;
};

const syncInfoSelector = createSelector(
  (props: PropsTypeInner) => props.etesync,
  (props: PropsTypeInner) => props.journals.value!,
  (props: PropsTypeInner) => props.entries,
  (props: PropsTypeInner) => props.userInfo.value!,
  (etesync, journals, entries, userInfo) => {
    const derived = etesync.encryptionKey;
    let asymmetricCryptoManager: EteSync.AsymmetricCryptoManager;
    try {
      const userInfoCryptoManager = new EteSync.CryptoManager(etesync.encryptionKey, 'userInfo');
      userInfo.verify(userInfoCryptoManager);
    } catch (error) {
      if (error instanceof EteSync.IntegrityError) {
        throw new EteSync.EncryptionPasswordError(error.message);
      } else {
        throw error;
      }
    }

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
          const syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
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
  }
);

const PimRouter = withRouter(Pim);

class SyncGate extends React.PureComponent<PropsTypeInner> {
  public componentDidMount() {
    const me = this.props.etesync.credentials.email;
    const syncAll = () => {
      store.dispatch<any>(fetchAll(this.props.etesync, this.props.entries)).then((haveJournals: boolean) => {
        if (haveJournals) {
          return;
        }

        ['ADDRESS_BOOK', 'CALENDAR', 'TASKS'].forEach((collectionType) => {
          const collection = new EteSync.CollectionInfo();
          collection.uid = EteSync.genUid();
          collection.type = collectionType;
          collection.displayName = 'Default';

          const journal = new EteSync.Journal();
          const cryptoManager = new EteSync.CryptoManager(this.props.etesync.encryptionKey, collection.uid);
          journal.setInfo(cryptoManager, collection);
          store.dispatch<any>(addJournal(this.props.etesync, journal)).then(
            (journalAction: Action<EteSync.Journal>) => {
              // FIXME: Limit based on error code to only do it for associates.
              if (!journalAction.error) {
                store.dispatch(fetchEntries(this.props.etesync, collection.uid));
              }
          });
        });
      });
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

  public render() {
    const entryArrays = this.props.entries;
    const journals = this.props.journals.value;

    if (this.props.userInfo.error) {
      return <PrettyError error={this.props.userInfo.error} />;
    } else if (this.props.journals.error) {
      return <PrettyError error={this.props.journals.error} />;
    } else {
      const errors: Array<{journal: string, error: Error}> = [];
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
      ((this.props.fetchCount > 0) &&
        ((entryArrays.size === 0) || !entryArrays.every((x: any) => (x.value !== null))))
      ) {
      return (<LoadingIndicator style={{display: 'block', margin: '40px auto'}} />);
    }

    // FIXME: Shouldn't be here
    moment.locale(this.props.settings.locale);


    const journalMap = syncInfoSelector(this.props);

    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('home')}
          exact
          render={({match}) => (
            <Redirect to={routeResolver.getRoute('pim')} />
          )}
        />
        <Route
          path={routeResolver.getRoute('pim')}
          render={({match, history}) => (
            <>
              <AppBarOverride title="EteSync" />
              <PimRouter
                etesync={this.props.etesync}
                userInfo={this.props.userInfo.value!}
                syncInfo={journalMap}
                history={history}
              />
            </>
          )}
        />
        <Route
          path={routeResolver.getRoute('journals')}
          render={({ location, history }) => (
            <Journals
              etesync={this.props.etesync}
              userInfo={this.props.userInfo.value!}
              syncInfo={journalMap}
              journals={journals}
              location={location}
              history={history}
            />
          )}
        />
        <Route
          path={routeResolver.getRoute('settings')}
          exact
          render={({history}) => (
            <Settings
              history={history}
            />
          )}
        />
      </Switch>
    );
  }
}

const mapStateToProps = (state: StoreState, props: PropsType) => {
  return {
    settings: state.settings,
    journals: state.cache.journals,
    entries: state.cache.entries,
    userInfo: state.cache.userInfo,
    fetchCount: state.fetchCount,
  };
};

// FIXME: this and withRouters are only needed here because of https://github.com/ReactTraining/react-router/issues/5795
export default withRouter(connect(
  mapStateToProps
)(SyncGate));
