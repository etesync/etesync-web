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

export interface CredentialsDataRemote {
  serviceApiUrl: string;
  credentials: EteSync.Credentials;
}

export interface CredentialsData extends CredentialsDataRemote {
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
export type CredentialsTypeRemote = FetchType<CredentialsDataRemote>;

export type JournalsData = List<EteSync.Journal>;

const JournalsFetchRecord = fetchTypeRecord<JournalsData>();
export type JournalsType = FetchType<JournalsData>;
export type JournalsTypeImmutable = Record<JournalsType>;

export type EntriesData = List<EteSync.Entry>;

const EntriesFetchRecord = fetchTypeRecord<EntriesData>();

export type EntriesTypeImmutable = Map<string, Record<FetchType<EntriesData>>>;
export type EntriesType = Map<string, FetchType<EntriesData>>;

export type UserInfoData = EteSync.UserInfo;

const UserInfoFetchRecord = fetchTypeRecord<UserInfoData>();
export type UserInfoType = FetchType<UserInfoData>;
export type UserInfoTypeImmutable = Record<UserInfoType>;

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

const encryptionKeyReducer = handleActions(
  {
    [actions.deriveKey.toString()]: (state: {key: string | null}, action: any) => (
      {key: action.payload}
    ),
    [actions.logout.toString()]: (state: {key: string | null}, action: any) => {
      return {out: true, key: null};
    },
  },
  {key: null}
);

const credentials = handleActions(
  {
    [actions.fetchCredentials.toString()]: (
      state: CredentialsTypeRemote, action: any, extend: boolean = false) => {
      if (action.error) {
        return {
          value: null,
          error: action.payload,
        };
      } else if (action.payload === undefined) {
        return {
          fetching: true,
          value: null,
        };
      } else {
        const {
          encryptionKey, // We don't want to set encryption key here.
          ...payload
        } = action.payload;
        return {
          value: payload,
        };
      }
    },
    [actions.logout.toString()]: (state: CredentialsTypeRemote, action: any) => {
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

const userInfo = handleAction(
  combineActions(
    actions.fetchUserInfo,
    actions.createUserInfo
  ),
  (state: Record<FetchType<any>> = fetchTypeRecord<any>()(), action: any, extend: boolean = false) => {
    if (action.error) {
      return state.set('error', action.payload);
    } else {
      let payload = (action.payload === undefined) ? null : action.payload;

      state = state.set('error', undefined);

      if (payload === null) {
        return state;
      }

      payload = (action.meta === undefined) ? payload : action.meta.userInfo;

      return state.set('value', payload);
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
  storage: localforage,
  whitelist: ['value'],
};

const encryptionKeyPersistConfig = {
  key: 'encryptionKey',
  storage: session,
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

const userInfoSerialize = (state: FetchType<UserInfoData>) => {
  if ((state === null) || (state.value == null)) {
    return null;
  }

  return state.value.serialize();
};

const userInfoDeserialize = (state: EteSync.UserInfoJson) => {
  if (state === null) {
    return null;
  }

  let ret = new EteSync.UserInfo(state.owner!, state.version);
  ret.deserialize(state);
  return ret;
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
  } else if (key === 'userInfo') {
    return userInfoSerialize(state);
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
  } else if (key === 'userInfo') {
    return new UserInfoFetchRecord({value: userInfoDeserialize(state)});
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
  encryptionKey: persistReducer(encryptionKeyPersistConfig, encryptionKeyReducer),
  cache: persistReducer(cachePersistConfig, combineReducers({
    entries,
    journals,
    userInfo,
  })),
});

export default reducers;
