import { createAction, createActions } from 'redux-actions';

import * as EteSync from '../api/EteSync';
import { UserInfo } from '../api/EteSync';

import { CredentialsData, EntriesType } from './';

export const { fetchCredentials, logout } = createActions({
  FETCH_CREDENTIALS: (username: string, password: string, server: string) => {
    const authenticator = new EteSync.Authenticator(server);

    return new Promise((resolve, reject) => {
      authenticator.getAuthToken(username, password).then(
        (authToken) => {
          const creds = new EteSync.Credentials(username, authToken);

          const context = {
            serviceApiUrl: server,
            credentials: creds,
          };

          resolve(context);
        },
        (error) => {
          reject(error);
        }
      );
    });
  },
  LOGOUT: () => undefined,
});

export const { deriveKey } = createActions({
  DERIVE_KEY: (username: string, encryptionPassword: string) => {
    return EteSync.deriveKey(username, encryptionPassword);
  },
});

export const login = (username: string, password: string, encryptionPassword: string, server: string) => {
  return (dispatch: any) => {
    dispatch(fetchCredentials(username, password, server)).then(() =>
      dispatch(deriveKey(username, encryptionPassword))
    );
  };
};

export const { fetchJournals } = createActions({
  FETCH_JOURNALS: (etesync: CredentialsData) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    let journalManager = new EteSync.JournalManager(creds, apiBase);

    return journalManager.list();
  },
});

export const { fetchEntries, createEntries } = createActions({
  FETCH_ENTRIES: [
    (etesync: CredentialsData, journalUid: string, prevUid: string | null) => {
      const creds = etesync.credentials;
      const apiBase = etesync.serviceApiUrl;
      let entryManager = new EteSync.EntryManager(creds, apiBase, journalUid);

      return entryManager.list(prevUid);
    },
    (etesync: CredentialsData, journalUid: string, prevUid: string | null) => {
      return { journal: journalUid, prevUid };
    }
  ],
  CREATE_ENTRIES: [
    (etesync: CredentialsData, journalUid: string, newEntries: Array<EteSync.Entry>, prevUid: string | null) => {
      const creds = etesync.credentials;
      const apiBase = etesync.serviceApiUrl;
      let entryManager = new EteSync.EntryManager(creds, apiBase, journalUid);

      return entryManager.create(newEntries, prevUid).then(response => newEntries);
    },
    (etesync: CredentialsData, journalUid: string, newEntries: Array<EteSync.Entry>, prevUid: string | null) => {
      return { journal: journalUid, entries: newEntries, prevUid };
    }
  ]
});

export const { fetchUserInfo } = createActions({
  FETCH_USER_INFO: (etesync: CredentialsData, owner: string) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    let userInfoManager = new EteSync.UserInfoManager(creds, apiBase);

    return userInfoManager.fetch(owner);
  },
});

export const createUserInfo = createAction(
  'CREATE_USER_INFO',
  (etesync: CredentialsData, userInfo: UserInfo) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    let userInfoManager = new EteSync.UserInfoManager(creds, apiBase);

    return userInfoManager.create(userInfo);
  },
  (etesync: CredentialsData, userInfo: UserInfo) => {
    return { userInfo };
  },
);

export function fetchAll(etesync: CredentialsData, currentEntries: EntriesType) {
  return (dispatch: any) => {
    return dispatch(fetchJournals(etesync)).then((journalsAction: any) => {
      const journals: Array<EteSync.Journal> = journalsAction.payload;
      if (!journals || (journals.length === 0)) {
        return false;
      }

      journals.forEach((journal) => {
        let prevUid: string | null = null;
        const entries = currentEntries.get(journal.uid);
        if (entries && entries.value) {
          const last = entries.value.last();
          prevUid = (last) ? last.uid : null;
        }

        dispatch(fetchEntries(etesync, journal.uid, prevUid));
      });

      return true;
    });
  };
}
