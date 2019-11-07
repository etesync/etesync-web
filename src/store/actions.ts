import { Action, createAction, createActions } from 'redux-actions';

import * as EteSync from '../api/EteSync';
import { UserInfo } from '../api/EteSync';

import { CredentialsData, EntriesType, SettingsType } from './';

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

export const resetKey = createAction(
  'RESET_KEY',
  () => {
    return null;
  }
);

export const login = (username: string, password: string, encryptionPassword: string, server: string) => {
  return (dispatch: any) => {
    dispatch(fetchCredentials(username, password, server)).then(() =>
      dispatch(deriveKey(username, encryptionPassword))
    );
  };
};

export const { fetchListJournal } = createActions({
  FETCH_LIST_JOURNAL: (etesync: CredentialsData) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalManager = new EteSync.JournalManager(creds, apiBase);

    return journalManager.list();
  },
});

export const addJournal = createAction(
  'ADD_JOURNAL',
  (etesync: CredentialsData, journal: EteSync.Journal) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalManager = new EteSync.JournalManager(creds, apiBase);

    return journalManager.create(journal);
  },
  (etesync: CredentialsData, journal: EteSync.Journal) => {
    return { item: journal };
  }
);

export const updateJournal = createAction(
  'UPDATE_JOURNAL',
  (etesync: CredentialsData, journal: EteSync.Journal) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalManager = new EteSync.JournalManager(creds, apiBase);

    return journalManager.update(journal);
  },
  (etesync: CredentialsData, journal: EteSync.Journal) => {
    return { item: journal };
  }
);

export const deleteJournal = createAction(
  'DELETE_JOURNAL',
  (etesync: CredentialsData, journal: EteSync.Journal) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalManager = new EteSync.JournalManager(creds, apiBase);

    return journalManager.delete(journal);
  },
  (etesync: CredentialsData, journal: EteSync.Journal) => {
    return { item: journal };
  }
);

export const { fetchEntries, addEntries } = createActions({
  FETCH_ENTRIES: [
    (etesync: CredentialsData, journalUid: string, prevUid: string | null) => {
      const creds = etesync.credentials;
      const apiBase = etesync.serviceApiUrl;
      const entryManager = new EteSync.EntryManager(creds, apiBase, journalUid);

      return entryManager.list(prevUid);
    },
    (etesync: CredentialsData, journalUid: string, prevUid: string | null) => {
      return { journal: journalUid, prevUid };
    },
  ],
  ADD_ENTRIES: [
    (etesync: CredentialsData, journalUid: string, newEntries: EteSync.Entry[], prevUid: string | null) => {
      const creds = etesync.credentials;
      const apiBase = etesync.serviceApiUrl;
      const entryManager = new EteSync.EntryManager(creds, apiBase, journalUid);

      return entryManager.create(newEntries, prevUid).then(() => newEntries);
    },
    (etesync: CredentialsData, journalUid: string, newEntries: EteSync.Entry[], prevUid: string | null) => {
      return { journal: journalUid, entries: newEntries, prevUid };
    },
  ],
});

export const { fetchUserInfo } = createActions({
  FETCH_USER_INFO: (etesync: CredentialsData, owner: string) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const userInfoManager = new EteSync.UserInfoManager(creds, apiBase);

    return userInfoManager.fetch(owner);
  },
});

export const createUserInfo = createAction(
  'CREATE_USER_INFO',
  (etesync: CredentialsData, userInfo: UserInfo) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const userInfoManager = new EteSync.UserInfoManager(creds, apiBase);

    return userInfoManager.create(userInfo);
  },
  (etesync: CredentialsData, userInfo: UserInfo) => {
    return { userInfo };
  }
);

export function fetchJournalEntries(etesync: CredentialsData, currentEntries: EntriesType, journal: EteSync.Journal) {
  return (dispatch: any) => {
    let prevUid: string | null = null;
    const entries = currentEntries.get(journal.uid);
    if (entries && entries.value) {
      const last = entries.value.last() as EteSync.Entry;
      prevUid = (last) ? last.uid : null;
    }

    return dispatch(fetchEntries(etesync, journal.uid, prevUid));
  };
}


export function fetchAll(etesync: CredentialsData, currentEntries: EntriesType) {
  return (dispatch: any) => {
    return dispatch(fetchListJournal(etesync)).then((journalsAction: Action<EteSync.Journal[]>) => {
      const journals = journalsAction.payload;
      if (!journals || (journals.length === 0)) {
        return false;
      }

      journals.forEach((journal) => {
        dispatch(fetchJournalEntries(etesync, currentEntries, journal));
      });

      return true;
    });
  };
}

// FIXME: Move the rest to their own file
export const setSettings = createAction(
  'SET_SETTINGS',
  (settings: SettingsType) => {
    return { ...settings };
  }
);
