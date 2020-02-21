import * as React from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect, RouteComponentProps, withRouter } from 'react-router';

import moment from 'moment';
import 'moment/locale/en-gb';

import { List, Map } from 'immutable';
import { createSelector } from 'reselect';

import { routeResolver } from './App';

import AppBarOverride from './widgets/AppBarOverride';
import LoadingIndicator from './widgets/LoadingIndicator';

import Journals from './Journals';
import Settings from './Settings';
import Debug from './Debug';
import Pim from './Pim';

import * as EteSync from 'etesync';
import { CURRENT_VERSION } from 'etesync';

import { store, SettingsType, JournalsData, EntriesType, StoreState, CredentialsData, UserInfoData } from './store';
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
  journals: JournalsData;
  entries: EntriesType;
  userInfo: UserInfoData;
  fetchCount: number;
};

const syncInfoSelector = createSelector(
  (props: PropsTypeInner) => props.etesync,
  (props: PropsTypeInner) => props.journals!,
  (props: PropsTypeInner) => props.entries,
  (props: PropsTypeInner) => props.userInfo,
  (etesync, journals, entries, userInfo) => {
    const derived = etesync.encryptionKey;
    const userInfoCryptoManager = userInfo.getCryptoManager(etesync.encryptionKey);
    try {
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

        const keyPair = userInfo.getKeyPair(userInfoCryptoManager);
        const cryptoManager = journal.getCryptoManager(derived, keyPair);

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

          const journal = new EteSync.Journal({ uid: collection.uid });
          const cryptoManager = new EteSync.CryptoManager(this.props.etesync.encryptionKey, collection.uid);
          journal.setInfo(cryptoManager, collection);
          (async () => {
            try {
              const addedJournalAction = addJournal(this.props.etesync, journal);
              await addedJournalAction.payload;
              store.dispatch(addedJournalAction);
              store.dispatch(fetchEntries(this.props.etesync, collection.uid));
            } catch (e) {
              // FIXME: Limit based on error code to only ignore for associates
              console.warn(`Failed creating journal for ${collection.type}. Associate?`);
            }
          })();
        });
      });
    };

    if (this.props.userInfo) {
      syncAll();
    } else {
      const fetching = fetchUserInfo(this.props.etesync, me);
      fetching.payload?.then(() => {
        store.dispatch(fetching);
        syncAll();
      }).catch(() => {
        const userInfo = new EteSync.UserInfo(me, CURRENT_VERSION);
        const keyPair = EteSync.AsymmetricCryptoManager.generateKeyPair();
        const cryptoManager = userInfo.getCryptoManager(this.props.etesync.encryptionKey);

        userInfo.setKeyPair(cryptoManager, keyPair);

        store.dispatch<any>(createUserInfo(this.props.etesync, userInfo)).then(syncAll);
      });
    }
  }

  public render() {
    const entryArrays = this.props.entries;
    const journals = this.props.journals;

    {
      const errors: Array<{journal: string, error: Error}> = [];
      this.props.entries.forEach((entry, journal) => {
        if (entry.error) {
          errors.push({ journal, error: entry.error });
        }
      });

      if (errors.length > 0) {
        return (
          <ul>
            {errors.map((error, idx) => (<li key={idx}>{error.journal}: {error.error.toString()}</li>))}
          </ul>
        );
      }
    }

    if ((this.props.userInfo === null) || (journals === null) ||
      ((this.props.fetchCount > 0) &&
        ((entryArrays.size === 0) || !entryArrays.every((x: any) => (x.value !== null))))
    ) {
      return (<LoadingIndicator style={{ display: 'block', margin: '40px auto' }} />);
    }

    // FIXME: Shouldn't be here
    moment.locale(this.props.settings.locale);


    const journalMap = syncInfoSelector(this.props);

    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('home')}
          exact
          render={() => (
            <Redirect to={routeResolver.getRoute('pim')} />
          )}
        />
        <Route
          path={routeResolver.getRoute('pim')}
          render={({ history }) => (
            <>
              <AppBarOverride title="EteSync" />
              <PimRouter
                etesync={this.props.etesync}
                userInfo={this.props.userInfo}
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
              userInfo={this.props.userInfo}
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
          render={({ history }) => (
            <Settings
              history={history}
            />
          )}
        />
        <Route
          path={routeResolver.getRoute('debug')}
          exact
          render={() => (
            <Debug
              etesync={this.props.etesync}
              userInfo={this.props.userInfo}
            />
          )}
        />
      </Switch>
    );
  }
}

const mapStateToProps = (state: StoreState, _props: PropsType) => {
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
