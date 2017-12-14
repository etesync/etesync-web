import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistReducer, persistStore, createTransform } from 'redux-persist';
import { createActions, handleAction, handleActions, combineActions } from 'redux-actions';
import * as localforage from 'localforage';
import session from 'redux-persist/lib/storage/session';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import { List, Map, Record } from 'immutable';

import promiseMiddleware from './promise-middleware';

import * as EteSync from './api/EteSync';

interface FetchTypeInterface<T> {
  value: T | null;
  fetching?: boolean;
  error?: Error;
}

export interface CredentialsData {
  serviceApiUrl: string;
  credentials: EteSync.Credentials;
  encryptionKey: string;
}

type FetchType<T> = FetchTypeInterface<T>;

function fetchTypeRecord<T>() {
  return Record<FetchTypeInterface<T>>({
    value: null as T | null,
  });
}

export type CredentialsType = FetchType<CredentialsData>;

export type JournalsData = List<EteSync.Journal>;

const JournalsFetchRecord = fetchTypeRecord<JournalsData>();
export type JournalsType = FetchType<JournalsData>;

export type EntriesData = List<EteSync.Entry>;

const EntriesFetchRecord = fetchTypeRecord<EntriesData>();

export type EntriesTypeImmutable = Map<string, Record<FetchType<EntriesData>>>;
export type EntriesType = Map<string, FetchType<EntriesData>>;

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsType;
  cache: {
    journals: JournalsType;
    entries: EntriesType;
  };
}

function credentialsIdentityReducer(state: CredentialsType = {value: null}, action: any, extend: boolean = false) {
  if (action.error) {
    return {
      value: null,
      error: action.payload,
    };
  } else {
    const fetching = (action.payload === undefined) ? true : undefined;
    const payload = (action.payload === undefined) ? null : action.payload;
    let value = payload;
    return {
      fetching,
      value,
    };
  }
}

function fetchTypeIdentityReducer(
  state: Record<FetchType<any>> = fetchTypeRecord<any>()(), action: any, extend: boolean = false) {
  if (action.error) {
    return state.set('value', null).set('error', action.payload);
  } else {
    const fetching = (action.payload === undefined) ? true : undefined;
    const payload = (action.payload === undefined) ? null : action.payload;
    let value = state.get('value', null);
    if (extend && (value !== null)) {
      if (payload !== null) {
        value = value.concat(payload);
      }
    } else if (payload !== null) {
      value = List(payload);
    } else {
      value = null;
    }
    return state.set('value', value).set('fetching', fetching);
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

const credentials = handleActions(
  {
    [fetchCredentials.toString()]: credentialsIdentityReducer,
    [logout.toString()]: (state: CredentialsType, action: any) => {
      return {out: true, value: null};
    },
  },
  {value: null}
);

export const entries = handleAction(
  combineActions(fetchEntries, createEntries),
  (state: EntriesTypeImmutable, action: any) => {
    const prevState = state.get(action.meta.journal);
    const extend = action.meta.prevUid != null;
    return state.set(action.meta.journal,
                     fetchTypeIdentityReducer(prevState, action, extend));
  },
  Map({})
);

const journals = handleAction(
  fetchJournals,
  fetchTypeIdentityReducer,
  new JournalsFetchRecord(),
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

  return state.map((x) => x.serialize()).toJS();
};

const journalsDeserialize = (state: EteSync.JournalJson[]) => {
  if (state === null) {
    return null;
  }

  return List(state.map((x: any) => {
    let ret = new EteSync.Journal(x.version);
    ret.deserialize(x);
    return ret;
  }));
};

const entriesSerialize = (state: FetchType<EntriesData>) => {
  if ((state === null) || (state.value == null)) {
    return null;
  }

  return state.value.map((x) => x.serialize()).toJS();
};

const entriesDeserialize = (state: EteSync.EntryJson[]): FetchType<EntriesData> => {
  if (state === null) {
    return new EntriesFetchRecord({value: null});
  }

  return new EntriesFetchRecord({value: List(state.map((x: any) => {
    let ret = new EteSync.Entry();
    ret.deserialize(x);
    return ret;
  }))});
};

const cacheSerialize = (state: any, key: string) => {
  if (key === 'entries') {
    let ret = {};
    state.forEach((value: FetchType<EntriesData>, mapKey: string) => {
      ret[mapKey] = entriesSerialize(value);
    });
    return ret;
  } else if (key === 'journals') {
    return journalsSerialize(state.value);
  }

  return state;
};

const cacheDeserialize = (state: any, key: string) => {
  if (key === 'entries') {
    let ret = {};
    Object.keys(state).forEach((mapKey) => {
      ret[mapKey] = entriesDeserialize(state[mapKey]);
    });
    return Map(ret);
  } else if (key === 'journals') {
    return new JournalsFetchRecord({value: journalsDeserialize(state)});
  }

  return state;
};

const cachePersistConfig = {
  key: 'cache',
  storage: localforage,
  transforms: [createTransform(cacheSerialize, cacheDeserialize)],
};

const reducers = combineReducers({
  fetchCount,
  credentials: persistReducer(credentialsPersistConfig, credentials),
  cache: persistReducer(cachePersistConfig, combineReducers({
    entries,
    journals,
  })),
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
