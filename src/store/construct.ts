import * as localforage from 'localforage';
import { combineReducers } from 'redux';
import { createMigrate, persistReducer, createTransform } from 'redux-persist';
import session from 'redux-persist/lib/storage/session';

import { List, Map as ImmutableMap } from 'immutable';

import * as EteSync from 'etesync';
import {
  JournalsData, FetchType, EntriesData, EntriesFetchRecord, UserInfoData,
  CredentialsDataRemote, EntriesType, SettingsType,
  fetchCount, journals, entries, credentials, userInfo, settingsReducer, encryptionKeyReducer, errorsReducer,
} from './reducers';

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsDataRemote;
  settings: SettingsType;
  encryptionKey: {key: string};
  cache: {
    journals: JournalsData;
    entries: EntriesType;
    userInfo: UserInfoData;
  };
  errors: List<Error>;
}

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

  return state.map((x, _uid) => x.serialize()).toJS();
};

const journalsDeserialize = (state: []) => {
  if (state === null) {
    return null;
  }

  const newState = ImmutableMap<string, EteSync.Journal>().asMutable();
  Object.keys(state).forEach((uid) => {
    const x = state[uid];
    const ret = new EteSync.Journal({ uid }, x.version);
    ret.deserialize(x);
    newState.set(uid, ret);
  });
  return newState.asImmutable();
};

const entriesSerialize = (state: FetchType<EntriesData>) => {
  if ((state === null) || (state.value == null)) {
    return null;
  }

  return state.value.map((x) => x.serialize()).toJS();
};

const entriesDeserialize = (state: EteSync.EntryJson[]): FetchType<EntriesData> => {
  if (state === null) {
    return new EntriesFetchRecord({ value: null });
  }

  return new EntriesFetchRecord({ value: List(state.map((x: any) => {
    const ret = new EteSync.Entry();
    ret.deserialize(x);
    return ret;
  })) });
};

const userInfoSerialize = (state: UserInfoData) => {
  if (state === null) {
    return null;
  }

  return state.serialize();
};

const userInfoDeserialize = (state: EteSync.UserInfoJson) => {
  if (state === null) {
    return null;
  }

  const ret = new EteSync.UserInfo(state.owner!, state.version);
  ret.deserialize(state);
  return ret;
};

const cacheSerialize = (state: any, key: string) => {
  if (key === 'entries') {
    const ret = {};
    state.forEach((value: FetchType<EntriesData>, mapKey: string) => {
      ret[mapKey] = entriesSerialize(value);
    });
    return ret;
  } else if (key === 'journals') {
    return journalsSerialize(state);
  } else if (key === 'userInfo') {
    return userInfoSerialize(state);
  }

  return state;
};

const cacheDeserialize = (state: any, key: string) => {
  if (key === 'entries') {
    const ret = {};
    Object.keys(state).forEach((mapKey) => {
      ret[mapKey] = entriesDeserialize(state[mapKey]);
    });
    return ImmutableMap(ret);
  } else if (key === 'journals') {
    return journalsDeserialize(state);
  } else if (key === 'userInfo') {
    return userInfoDeserialize(state);
  }

  return state;
};

const cacheMigrations = {
  0: (state: any) => {
    return {
      ...state,
      journals: undefined,
    };
  },
};

const cachePersistConfig = {
  key: 'cache',
  version: 1,
  storage: localforage,
  transforms: [createTransform(cacheSerialize, cacheDeserialize)],
  migrate: createMigrate(cacheMigrations, { debug: false }),
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
  errors: errorsReducer,
});

export default reducers;
