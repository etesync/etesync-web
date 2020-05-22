// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import { useSelector } from 'react-redux';
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

import { store, JournalsData, EntriesData, StoreState, CredentialsData, UserInfoData } from './store';
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

interface SelectorProps {
  etesync: CredentialsData;
  journals: JournalsData;
  entries: EntriesData;
  userInfo: UserInfoData;
}

const syncInfoSelector = createSelector(
  (props: SelectorProps) => props.etesync,
  (props: SelectorProps) => props.journals!,
  (props: SelectorProps) => props.entries,
  (props: SelectorProps) => props.userInfo,
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

        if (!journalEntries) {
          return ret;
        }

        const keyPair = userInfo.getKeyPair(userInfoCryptoManager);
        const cryptoManager = journal.getCryptoManager(derived, keyPair);

        const collectionInfo = journal.getInfo(cryptoManager);

        const syncEntries = journalEntries.map((entry: EteSync.Entry) => {
          const syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
          prevUid = entry.uid;

          return syncEntry;
        });

        return ret.set(journal.uid, {
          entries: syncEntries,
          collection: collectionInfo,
          journal,
          journalEntries,
        });
      },
      Map<string, SyncInfoJournal>()
    );
  }
);

const PimRouter = withRouter(Pim);

// FIXME: this and withRouters are only needed here because of https://github.com/ReactTraining/react-router/issues/5795
export default withRouter(function SyncGate(props: RouteComponentProps<{}> & PropsType) {
  const etesync = props.etesync;
  const settings = useSelector((state: StoreState) => state.settings);
  const fetchCount = useSelector((state: StoreState) => state.fetchCount);
  const userInfo = useSelector((state: StoreState) => state.cache.userInfo);
  const journals = useSelector((state: StoreState) => state.cache.journals);
  const entries = useSelector((state: StoreState) => state.cache.entries);

  React.useEffect(() => {
    const me = etesync.credentials.email;
    const syncAll = () => {
      store.dispatch<any>(fetchAll(etesync, entries)).then((haveJournals: boolean) => {
        if (haveJournals) {
          return;
        }

        ['ADDRESS_BOOK', 'CALENDAR', 'TASKS'].forEach((collectionType) => {
          const collection = new EteSync.CollectionInfo();
          collection.uid = EteSync.genUid();
          collection.type = collectionType;
          collection.displayName = 'Default';

          const journal = new EteSync.Journal({ uid: collection.uid });
          const cryptoManager = new EteSync.CryptoManager(etesync.encryptionKey, collection.uid);
          journal.setInfo(cryptoManager, collection);
          (async () => {
            try {
              const addedJournalAction = addJournal(etesync, journal);
              await addedJournalAction.payload;
              store.dispatch(addedJournalAction);
              store.dispatch(fetchEntries(etesync, collection.uid));
            } catch (e) {
              // FIXME: Limit based on error code to only ignore for associates
              console.warn(`Failed creating journal for ${collection.type}. Associate?`);
            }
          })();
        });
      });
    };

    if (userInfo) {
      syncAll();
    } else {
      const fetching = fetchUserInfo(etesync, me);
      fetching.payload?.then(() => {
        store.dispatch(fetching);
        syncAll();
      }).catch(() => {
        const userInfo = new EteSync.UserInfo(me, CURRENT_VERSION);
        const keyPair = EteSync.AsymmetricCryptoManager.generateKeyPair();
        const cryptoManager = userInfo.getCryptoManager(etesync.encryptionKey);

        userInfo.setKeyPair(cryptoManager, keyPair);

        store.dispatch<any>(createUserInfo(etesync, userInfo)).then(syncAll);
      });
    }
  }, []);

  const entryArrays = entries;

  if ((userInfo === null) || (journals === null) ||
    ((fetchCount > 0) &&
      ((entryArrays.size === 0) || entryArrays.some((x) => (x.size === 0))))
  ) {
    return (<LoadingIndicator style={{ display: 'block', margin: '40px auto' }} />);
  }

  // FIXME: Shouldn't be here
  moment.locale(settings.locale);


  const journalMap = syncInfoSelector({ etesync, userInfo, journals, entries });

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
              etesync={etesync}
              userInfo={userInfo}
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
            etesync={etesync}
            userInfo={userInfo}
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
        render={() => (
          <Settings />
        )}
      />
      <Route
        path={routeResolver.getRoute('debug')}
        exact
        render={() => (
          <Debug
            etesync={etesync}
            userInfo={userInfo}
          />
        )}
      />
    </Switch>
  );
});
