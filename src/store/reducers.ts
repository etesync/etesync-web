import { combineReducers } from 'redux';
import { persistReducer, createTransform } from 'redux-persist';
import { handleAction, handleActions, combineActions } from 'redux-actions';

import * as localforage from 'localforage';
import session from 'redux-persist/lib/storage/session';

import { List, Map, Record } from 'immutable';

import * as EteSync from '../api/EteSync';

import * as actions from './actions';

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

export type FetchType<T> = FetchTypeInterface<T>;

function fetchTypeRecord<T>() {
  return Record<FetchTypeInterface<T>>({
    value: null as T | null,
    error: undefined,
  });
}

export type CredentialsType = FetchType<CredentialsData>;

export type JournalsData = List<EteSync.Journal>;

const JournalsFetchRecord = fetchTypeRecord<JournalsData>();
export type JournalsType = FetchType<JournalsData>;
export type JournalsTypeImmutable = Record<JournalsType>;

export type EntriesData = List<EteSync.Entry>;

const EntriesFetchRecord = fetchTypeRecord<EntriesData>();

export type EntriesTypeImmutable = Map<string, Record<FetchType<EntriesData>>>;
export type EntriesType = Map<string, FetchType<EntriesData>>;

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
    return state.set('error', action.payload);
  } else {
    const payload = (action.payload === undefined) ? null : action.payload;

    state = state.set('error', undefined);

    if (action.payload === undefined) {
      return state;
    }

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
    return state.set('value', value);
  }
}

const credentials = handleActions(
  {
    [actions.fetchCredentials.toString()]: credentialsIdentityReducer,
    [actions.logout.toString()]: (state: CredentialsType, action: any) => {
      return {out: true, value: null};
    },
  },
  {value: null}
);

export const entries = handleAction(
  combineActions(actions.fetchEntries, actions.createEntries),
  (state: EntriesTypeImmutable, action: any) => {
    const prevState = state.get(action.meta.journal);
    const extend = action.meta.prevUid != null;
    return state.set(action.meta.journal,
                     fetchTypeIdentityReducer(prevState, action, extend));
  },
  Map({})
);

const journals = handleAction(
  actions.fetchJournals,
  (state: JournalsTypeImmutable, action: any) => {
    const newState = fetchTypeIdentityReducer(state, action);
    // Compare the states and see if they are really different
    const oldJournals = state.get('value', null);
    const newJournals = newState.get('value', null);

    if (!oldJournals || !newJournals || (oldJournals.size !== newJournals.size)) {
      return newState;
    }

    let oldJournalHash = {};
    oldJournals.forEach((x) => {
      oldJournalHash[x.uid] = x.serialize();
    });

    if (newJournals.every((journal: EteSync.Journal) => (
      (journal.uid in oldJournalHash) &&
      (journal.serialize().content === oldJournalHash[journal.uid].content)
    ))) {
      return state;
    } else {
      return newState;
    }
  },
  new JournalsFetchRecord(),
);

const fetchCount = handleAction(
  combineActions(
    actions.fetchCredentials,
    actions.fetchJournals,
    actions.fetchEntries
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

export default reducers;
