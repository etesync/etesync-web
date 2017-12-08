import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistReducer, persistStore, createTransform } from 'redux-persist';
import { createActions, handleAction, handleActions, combineActions } from 'redux-actions';
import * as localforage from 'localforage';
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

function fetchTypeIdentityReducer(state: FetchType<any> = {value: null}, action: any, extend: boolean = false) {
  if (action.error) {
    return {
      value: null,
      error: action.payload,
    };
  } else {
    const fetching = (action.payload === undefined) ? true : undefined;
    const payload = (action.payload === undefined) ? null : action.payload;
    let value = state.value;
    if (extend && (value !== null)) {
      if (payload !== null) {
        value = value.concat(payload);
      }
    } else {
      value = payload;
    }
    return {
      fetching,
      value,
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
    const prevState = state[action.meta.journal];
    const extend = action.meta.prevUid != null;
    return { ...state,
      [action.meta.journal]: fetchTypeIdentityReducer(prevState, action, extend)
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

const journalsSerialize = (state: JournalsData) => {
  if (state === null) {
    return null;
  }

  return state.map((x) => x.serialize());
};

const journalsDeserialize = (state: EteSync.JournalJson[]) => {
  if (state === null) {
    return null;
  }

  return state.map((x: any) => {
    let ret = new EteSync.Journal(x.version);
    ret.deserialize(x);
    return ret;
  });
};

const cacheJournalsPersistConfig = {
  key: 'journals',
  storage: localforage,
  transforms: [createTransform(journalsSerialize, journalsDeserialize)],
  whitelist: ['value'],
};

const entriesSerialize = (state: FetchType<EntriesData>, key: string) => {
  if ((state === null) || (state.value == null)) {
    return null;
  }

  return state.value.map((x) => x.serialize());
};

const entriesDeserialize = (state: EteSync.EntryJson[], key: string): FetchType<EntriesData> => {
  if (state === null) {
    return {value: null};
  }

  return {value: state.map((x: any) => {
    let ret = new EteSync.Entry();
    ret.deserialize(x);
    return ret;
  })};
};

const cacheEntriesPersistConfig = {
  key: 'entries',
  storage: localforage,
  transforms: [createTransform(entriesSerialize, entriesDeserialize)],
};

const reducers = combineReducers({
  fetchCount,
  credentials: persistReducer(credentialsPersistConfig, credentials),
  cache: combineReducers({
    journals: persistReducer(cacheJournalsPersistConfig, journals),
    entries: persistReducer(cacheEntriesPersistConfig, entries),
  })
});

let middleware = [
  thunkMiddleware,
  promiseMiddleware,
];

if (process.env.NODE_ENV === 'development') {
  middleware.push(createLogger());
}

export const store = createStore(
  reducers,
  applyMiddleware(...middleware)
);

export const persistor = persistStore(store);
