import { combineReducers } from 'redux';
import { createMigrate, persistReducer, createTransform } from 'redux-persist';
import { Action, ActionFunctionAny, combineActions, handleAction, handleActions } from 'redux-actions';

import * as localforage from 'localforage';
import session from 'redux-persist/lib/storage/session';

import { List, Map as ImmutableMap, Record } from 'immutable';

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

interface BaseModel {
  uid: string;
}

export type CredentialsType = FetchType<CredentialsData>;
export type CredentialsTypeRemote = FetchType<CredentialsDataRemote>;

export type JournalsData = ImmutableMap<string, EteSync.Journal>;
const JournalsFetchRecord = fetchTypeRecord<JournalsData>();
export type JournalsType = FetchType<JournalsData>;
export type JournalsTypeImmutable = Record<JournalsType>;

export type EntriesData = List<EteSync.Entry>;

const EntriesFetchRecord = fetchTypeRecord<EntriesData>();

export type EntriesTypeImmutable = ImmutableMap<string, Record<FetchType<EntriesData>>>;
export type EntriesType = ImmutableMap<string, FetchType<EntriesData>>;

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

const setMapModelReducer = <T extends Record<any>, V extends BaseModel>(state: T, action: any) => {
  const newState = fetchTypeIdentityReducer(state, action);
  // Compare the states and see if they are really different
  const newItems = newState.get('value', null);

  if (!newItems) {
    return newState;
  }

  const ret = new Map<string, V>();

  newItems.forEach((item: V) => {
    ret.set(item.uid, item);
  });

  return newState.set('value', ImmutableMap(ret));
};

const addEditMapModelReducer = <T extends Record<any>, V extends BaseModel>(state: T, action: any) => {
  if (action.error) {
    return state.set('error', action.payload);
  } else {
    let payload = (action.payload === undefined) ? null : action.payload;
    payload = (action.meta === undefined) ? payload : action.meta.item;

    state = state.set('error', undefined);

    if (action.payload === undefined) {
      return state;
    }

    const item = payload as V;
    let value = state.get('value', null)!;
    value = value.set(item.uid, item);
    return state.set('value', value);
  }
};

const deleteMapModelReducer = <T extends Record<any>>(state: T, action: any) => {
  if (action.error) {
    return state.set('error', action.payload);
  } else {
    let payload = (action.payload === undefined) ? null : action.payload;
    payload = (action.meta === undefined) ? payload : action.meta.item;

    state = state.set('error', undefined);

    if (action.payload === undefined) {
      return state;
    }

    const id = payload as number;
    let value = state.get('value', null)!;
    value = value.delete(id);
    return state.set('value', value);
  }
};

const mapReducerActionsMapCreator = <T extends Record<any>, V extends BaseModel>(actionName: string) => {
  const setsReducer = (state: T, action: any) => setMapModelReducer<T, V>(state, action);
  const addEditReducer = (state: T, action: any) => addEditMapModelReducer<T, V>(state, action);
  const deleteReducer = (state: T, action: any) => deleteMapModelReducer<T>(state, action);

  return {
    [actions['fetchList' + actionName].toString() as string]: setsReducer,
    [actions['add' + actionName].toString() as string]: addEditReducer,
    [actions['update' + actionName].toString() as string]: addEditReducer,
    [actions['delete' + actionName].toString() as string]: deleteReducer,
  };
};

export const entries = handleAction(
  combineActions(actions.fetchEntries, actions.createEntries),
  (state: EntriesTypeImmutable, action: any) => {
    const prevState = state.get(action.meta.journal);
    const extend = action.meta.prevUid != null;
    return state.set(action.meta.journal,
                     fetchTypeIdentityReducer(prevState, action, extend));
  },
  ImmutableMap({})
);

const journals = handleActions(
  {
    ...mapReducerActionsMapCreator<JournalsTypeImmutable, EteSync.Journal>('Journal'),
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

const fetchActions = [
] as Array<ActionFunctionAny<Action<any>>>;

for (const func in actions) {
  if (func.startsWith('fetchList') ||
    func.startsWith('add') ||
    func.startsWith('update') ||
    func.startsWith('delete')) {

    fetchActions.push(actions[func]);
  }
}

// Indicates network activity, not just fetch
const fetchCount = handleAction(
  combineActions(
    ...fetchActions,
  ),
  (state: number, action: any) => {
    if (action.payload === undefined) {
      return state + 1;
    } else {
      return state - 1;
    }
  },
  0,
);

// FIXME Move all the below (potentially the fetchCount ones too) to their own file
export interface SettingsType {
  locale: string;
};

const settingsReducer = handleActions(
  {
    [actions.setSettings.toString()]: (state: {key: string | null}, action: any) => (
      {...action.payload}
    ),
  },
  { locale: 'en-gb' }
);

const settingsPersistConfig = {
  key: 'settings',
  storage: localforage,
};

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

  return state.map((x, uid) => x.serialize()).toJS();
};

const journalsDeserialize = (state: {}) => {
  if (state === null) {
    return null;
  }

  const newState = new Map<string, EteSync.Journal>();
  Object.keys(state).forEach((uid) => {
    const x = state[uid];
    const ret = new EteSync.Journal(x.version);
    ret.deserialize(x);
    newState.set(uid, ret);
  });
  return ImmutableMap(newState);
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
    return ImmutableMap(ret);
  } else if (key === 'journals') {
    return new JournalsFetchRecord({value: journalsDeserialize(state)});
  } else if (key === 'userInfo') {
    return new UserInfoFetchRecord({value: userInfoDeserialize(state)});
  }

  return state;
};

const cacheMigrations = {
  0: (state: any) => {
    return {
      ...state,
      journals: undefined
    };
  },
};

const cachePersistConfig = {
  key: 'cache',
  version: 1,
  storage: localforage,
  transforms: [createTransform(cacheSerialize, cacheDeserialize)],
  migrate: createMigrate(cacheMigrations, { debug: false}),
};

const reducers = combineReducers({
  fetchCount,
  settings: persistReducer(settingsPersistConfig, settingsReducer),
  credentials: persistReducer(credentialsPersistConfig, credentials),
  encryptionKey: persistReducer(encryptionKeyPersistConfig, encryptionKeyReducer),
  cache: persistReducer(cachePersistConfig, combineReducers({
    entries,
    journals,
    userInfo,
  })),
});

export default reducers;
