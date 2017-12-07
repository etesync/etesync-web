import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import { createActions, handleAction, handleActions, combineActions } from 'redux-actions';
import session from 'redux-persist/lib/storage/session';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import promiseMiddleware from './promise-middleware';

import * as EteSync from './api/EteSync';

export interface FetchType<T> {
  value: T | null;
  fetching?: boolean;
  error?: Error;
}

export interface CredentialsData {
  serviceApiUrl: string;
  credentials: EteSync.Credentials;
  encryptionKey: string;
}

export type CredentialsType = FetchType<CredentialsData>;

export type JournalsData = Array<EteSync.Journal>;

export type JournalsType = FetchType<JournalsData>;

export type EntriesData = Array<EteSync.Entry>;

export type EntriesType = {[key: string]: FetchType<EntriesData>};

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsType;
  cache: {
    journals: JournalsType;
    entries: EntriesType;
  };
}

function fetchTypeIdentityReducer(state: FetchType<any>, action: any) {
  if (action.error) {
    return {
      value: null,
      error: action.payload,
    };
  } else {
    const fetching = (action.payload === undefined) ? true : undefined;
    return {
      fetching,
      value: (action.payload === undefined) ? null : action.payload,
    };
  }
}

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

export const { fetchJournals, fetchEntries } = createActions({
  FETCH_JOURNALS: (etesync: CredentialsData) => {
    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    let journalManager = new EteSync.JournalManager(creds, apiBase);

    return journalManager.list();
  },
  FETCH_ENTRIES: [
    (etesync: CredentialsData, journalUid: string, prevUid: string | null) => {
      const creds = etesync.credentials;
      const apiBase = etesync.serviceApiUrl;
      let entryManager = new EteSync.EntryManager(creds, apiBase, journalUid);

      return entryManager.list(prevUid) as any;
    },
    (etesync: CredentialsData, journalUid: string, prevUid: string | null) => {
      return { journal: journalUid, prevUid };
    }
  ]
});

const credentials = handleActions(
  {
    [fetchCredentials.toString()]: fetchTypeIdentityReducer,
    [logout.toString()]: (state: CredentialsType, action: any) => {
      return {out: true, value: null};
    },
  },
  {value: null}
);

const entries = handleAction(
  fetchEntries,
  (state: EntriesType, action: any) => {
    return { ...state,
      [action.meta.journal]: fetchTypeIdentityReducer(state[action.meta.journal], action)
    };
  },
  {}
);

const journals = handleAction(
  fetchJournals,
  fetchTypeIdentityReducer,
  {value: null}
);

const fetchCount = handleAction(
  combineActions(
    fetchCredentials,
    fetchJournals,
    fetchEntries
  ),
  (state: number, action: any) => {
    if (action.payload === undefined) {
      return state + 1;
    } else {
      return state - 1;
    }
  },
  0
);

const credentialsPersistConfig = {
  key: 'credentials',
  storage: session,
  whitelist: ['value'],
};

const reducers = combineReducers({
  fetchCount,
  credentials: persistReducer(credentialsPersistConfig, credentials),
  cache: combineReducers({
    journals,
    entries,
  })
});

let middleware = [
  thunkMiddleware,
  promiseMiddleware,
];

if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger());
}

export const store = createStore(
  reducers,
  applyMiddleware(...middleware)
);

export const persistor = persistStore(store);
