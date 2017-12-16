import { createActions } from 'redux-actions';

import * as EteSync from '../api/EteSync';

import { CredentialsData, EntriesType } from './';

export const { fetchCredentials, logout } = createActions({
  FETCH_CREDENTIALS: (username: string, password: string, encryptionPassword: string, server: string) => {
    const authenticator = new EteSync.Authenticator(server);

    return new Promise((resolve, reject) => {
      authenticator.getAuthToken(username, password).then(
        (authToken) => {
          const creds = new EteSync.Credentials(username, authToken);
          const derived = EteSync.deriveKey(username, encryptionPassword);

          const context = {
            serviceApiUrl: server,
            credentials: creds,
            encryptionKey: derived,
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

export function fetchAll(etesync: CredentialsData, currentEntries: EntriesType) {
  return (dispatch: any) => {
    dispatch(fetchJournals(etesync)).then((journalsAction: any) => {
      const journals: Array<EteSync.Journal> = journalsAction.payload;
      if (!journals) {
        return;
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
    });
  };
}
