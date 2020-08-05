// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { Action, createAction, createActions } from "redux-actions";

import * as EteSync from "etesync";
import { UserInfo } from "etesync";

import { CredentialsData, CredentialsDataRemote, EntriesData, SettingsType } from "./";

export const { fetchCredentials } = createActions({
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
});

export const logout = createAction(
  "LOGOUT",
  (etesync: CredentialsDataRemote) => {
    (async () => {
      const authenticator = new EteSync.Authenticator(etesync.serviceApiUrl);
      try {
        await authenticator.invalidateToken(etesync.credentials.authToken);
      } catch {
        // Ignore for now. It usually means the token was a legacy one.
      }
    })();
    return; // We are not waiting on the above on purpose for now, just invalidate the token in the background
  }
);

export const { deriveKey } = createActions({
  DERIVE_KEY: (username: string, encryptionPassword: string) => {
    return EteSync.deriveKey(username, encryptionPassword);
  },
});

export const resetKey = createAction(
  "RESET_KEY",
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
  "ADD_JOURNAL",
  (etesync: CredentialsData, journal: EteSync.Journal) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalManager = new EteSync.JournalManager(creds, apiBase);

    return journalManager.create(journal);
  },
  (_etesync: CredentialsData, journal: EteSync.Journal) => {
    return { item: journal };
  }
);

export const updateJournal = createAction(
  "UPDATE_JOURNAL",
  (etesync: CredentialsData, journal: EteSync.Journal) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalManager = new EteSync.JournalManager(creds, apiBase);

    return journalManager.update(journal);
  },
  (_etesync: CredentialsData, journal: EteSync.Journal) => {
    return { item: journal };
  }
);

export const deleteJournal = createAction(
  "DELETE_JOURNAL",
  (etesync: CredentialsData, journal: EteSync.Journal) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalManager = new EteSync.JournalManager(creds, apiBase);

    return journalManager.delete(journal);
  },
  (_etesync: CredentialsData, journal: EteSync.Journal) => {
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
    (_etesync: CredentialsData, journalUid: string, prevUid: string | null) => {
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
    (_etesync: CredentialsData, journalUid: string, newEntries: EteSync.Entry[], prevUid: string | null) => {
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
  "CREATE_USER_INFO",
  (etesync: CredentialsData, userInfo: UserInfo) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const userInfoManager = new EteSync.UserInfoManager(creds, apiBase);

    return userInfoManager.create(userInfo);
  },
  (_etesync: CredentialsData, userInfo: UserInfo) => {
    return { userInfo };
  }
);

export function fetchAll(etesync: CredentialsData, currentEntries: EntriesData) {
  return (dispatch: any) => {
    return new Promise<boolean>((resolve, reject) => {
      dispatch(fetchListJournal(etesync)).then((journalsAction: Action<EteSync.Journal[]>) => {
        const journals = journalsAction.payload;
        if (!journals || (journals.length === 0)) {
          resolve(false);
          return;
        }

        Promise.all(journals.map((journal) => {
          const prevUid = currentEntries.get(journal.uid)?.last(undefined)?.uid ?? null;

          // FIXME: expose it in a non-hacky way.
          if (prevUid && (prevUid === (journal as any)._json.lastUid)) {
            return true;
          }
          return dispatch(fetchEntries(etesync, journal.uid, prevUid));
        })).then(() => resolve(true)).catch(reject);
      }).catch(reject);
    });
  };
}


export const appendError = createAction(
  "APPEND_ERROR",
  (_etesync: CredentialsData, error: Error | Error[]) => {
    return Array.isArray(error) ? error : [error];
  }
);

export const clearErros = createAction(
  "CLEAR_ERRORS",
  (_etesync: CredentialsData) => {
    return true;
  }
);

// FIXME: Move the rest to their own file
export const setSettings = createAction(
  "SET_SETTINGS",
  (settings: Partial<SettingsType>) => {
    return { ...settings };
  }
);
