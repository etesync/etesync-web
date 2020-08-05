// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as localforage from "localforage";
import { combineReducers } from "redux";
import { createMigrate, persistReducer, createTransform } from "redux-persist";
import session from "redux-persist/lib/storage/session";

import { List, Map as ImmutableMap } from "immutable";

import * as EteSync from "etesync";
import {
  JournalsData, EntriesData, UserInfoData,
  CredentialsDataRemote, SettingsType,
  fetchCount, journals, entries, credentials, userInfo, settingsReducer, encryptionKeyReducer, errorsReducer,
  syncGeneral, syncCollections, collections, items,
  SyncGeneralData, SyncCollectionsData, CacheCollectionsData, CacheItemsData, CredentialsData2,
} from "./reducers";

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsDataRemote;
  credentials2: CredentialsData2;
  settings: SettingsType;
  encryptionKey: {key: string};
  sync: {
    collections: SyncCollectionsData;
    general: SyncGeneralData;
  };
  cache2: {
    collections: CacheCollectionsData;
    items: CacheItemsData;
  };
  cache: {
    journals: JournalsData;
    entries: EntriesData;
    userInfo: UserInfoData;
  };
  errors: List<Error>;
}

const settingsMigrations = {
  0: (state: any) => {
    return {
      ...state,
      taskSettings: {
        filterBy: null,
        sortBy: "smart",
      },
    };
  },
};

const settingsPersistConfig = {
  key: "settings",
  version: 0,
  storage: localforage,
  migrate: createMigrate(settingsMigrations, { debug: false }),
};

const credentialsMigrations = {
  0: (state: any) => {
    return state.value;
  },
};

const credentialsPersistConfig = {
  key: "credentials",
  version: 0,
  storage: localforage,
  migrate: createMigrate(credentialsMigrations, { debug: false }),
};

const credentials2PersistConfig = {
  key: "credentials2",
  version: 0,
  storage: localforage,
};

const encryptionKeyPersistConfig = {
  key: "encryptionKey",
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

const entriesSerialize = (state: List<EteSync.Entry>) => {
  if (state === null) {
    return null;
  }

  return state.map((x) => x.serialize()).toJS();
};

const entriesDeserialize = (state: EteSync.EntryJson[]): List<EteSync.Entry> | null => {
  if (state === null) {
    return null;
  }

  return List(state.map((x) => {
    const ret = new EteSync.Entry();
    ret.deserialize(x);
    return ret;
  }));
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

const cacheSerialize = (state: any, key: string | number) => {
  if (key === "entries") {
    const ret = {};
    state.forEach((value: List<EteSync.Entry>, mapKey: string) => {
      ret[mapKey] = entriesSerialize(value);
    });
    return ret;
  } else if (key === "journals") {
    return journalsSerialize(state);
  } else if (key === "userInfo") {
    return userInfoSerialize(state);
  }

  return state;
};

const cacheDeserialize = (state: any, key: string | number) => {
  if (key === "entries") {
    const ret = {};
    Object.keys(state).forEach((mapKey) => {
      ret[mapKey] = entriesDeserialize(state[mapKey]);
    });
    return ImmutableMap(ret);
  } else if (key === "journals") {
    return journalsDeserialize(state);
  } else if (key === "userInfo") {
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
  2: (state: any) => {
    return {
      ...state,
      userInfo: state.userInfo?.value,
      journals: state.journals?.value,
      entries: undefined, // For now we just reset the entries
    };
  },
};

const cachePersistConfig = {
  key: "cache",
  version: 2,
  storage: localforage,
  transforms: [createTransform(cacheSerialize, cacheDeserialize)],
  migrate: createMigrate(cacheMigrations, { debug: false }),
};

const syncSerialize = (state: any, key: string | number) => {
  if (key === "collections") {
    return state.toJS();
  }

  return state;
};

const syncDeserialize = (state: any, key: string | number) => {
  if (key === "collections") {
    return ImmutableMap(state);
  }

  return state;
};

const syncPersistConfig = {
  key: "sync",
  storage: localforage,
  transforms: [createTransform(syncSerialize, syncDeserialize)],
};

const cache2Serialize = (state: any, key: string | number) => {
  if (key === "collections") {
    return state.toJS();
  } else if (key === "items") {
    return state.toJS();
  }

  return state;
};

const cache2Deserialize = (state: any, key: string | number) => {
  if (key === "collections") {
    return ImmutableMap(state);
  } else if (key === "items") {
    return ImmutableMap(state).map((item: any) => {
      return ImmutableMap(item);
    });
  }

  return state;
};

const cache2PersistConfig = {
  key: "cache2",
  version: 0,
  storage: localforage,
  transforms: [createTransform(cache2Serialize, cache2Deserialize)] as any,
};

const reducers = combineReducers({
  fetchCount,
  settings: persistReducer(settingsPersistConfig, settingsReducer),
  credentials: persistReducer(credentialsPersistConfig, credentials),
  credentials2: persistReducer(credentials2PersistConfig, credentials),
  encryptionKey: persistReducer(encryptionKeyPersistConfig, encryptionKeyReducer),
  sync: persistReducer(syncPersistConfig, combineReducers({
    collections: syncCollections,
    general: syncGeneral,
  })),
  cache2: persistReducer(cache2PersistConfig, combineReducers({
    collections,
    items,
  })),
  cache: persistReducer(cachePersistConfig, combineReducers({
    entries,
    journals,
    userInfo,
  })),
  errors: errorsReducer,
});

export default reducers;
