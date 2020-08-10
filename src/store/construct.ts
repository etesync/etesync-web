// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as localforage from "localforage";
import { combineReducers } from "redux";
import { createMigrate, persistReducer, createTransform } from "redux-persist";
import session from "redux-persist/lib/storage/session";

import * as Etebase from "etebase";

import { List, Map as ImmutableMap } from "immutable";
import {
  SettingsType,
  fetchCount, credentials, settingsReducer, encryptionKeyReducer, errorsReducer,
  syncGeneral, syncCollections, collections, items,
  SyncGeneralData, SyncCollectionsData, CacheCollectionsData, CacheItemsData, CredentialsData,
} from "./reducers";

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsData;
  settings: SettingsType;
  encryptionKey: {key: string};
  sync: {
    collections: SyncCollectionsData;
    general: SyncGeneralData;
  };
  cache: {
    collections: CacheCollectionsData;
    items: CacheItemsData;
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

const credentialsPersistConfig = {
  key: "credentials2",
  version: 0,
  storage: localforage,
};

const encryptionKeyPersistConfig = {
  key: "encryptionKey",
  storage: session,
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

const cacheSerialize = (state: any, key: string | number) => {
  if (key === "collections") {
    const typedState = state as CacheCollectionsData;
    const ret = typedState.map((x) => Etebase.toBase64(x));
    return ret.toJS();
  } else if (key === "items") {
    const typedState = state as CacheItemsData;
    const ret = typedState.map((items) => {
      return items.map((x) => Etebase.toBase64(x));
    });
    return ret.toJS();
  }

  return state;
};

const cacheDeserialize = (state: any, key: string | number) => {
  if (key === "collections") {
    return ImmutableMap<string, string>(state).map((x) => {
      return Etebase.fromBase64(x);
    });
  } else if (key === "items") {
    return ImmutableMap(state).map((item: any) => {
      return ImmutableMap<string, string>(item).map((x) => Etebase.fromBase64(x));
    });
  }

  return state;
};

const cachePersistConfig = {
  key: "cache2",
  version: 0,
  storage: localforage,
  transforms: [createTransform(cacheSerialize, cacheDeserialize)] as any,
};

const reducers = combineReducers({
  fetchCount,
  settings: persistReducer(settingsPersistConfig, settingsReducer),
  credentials: persistReducer(credentialsPersistConfig, credentials),
  encryptionKey: persistReducer(encryptionKeyPersistConfig, encryptionKeyReducer),
  sync: persistReducer(syncPersistConfig, combineReducers({
    collections: syncCollections,
    general: syncGeneral,
  })),
  cache: persistReducer(cachePersistConfig, combineReducers({
    collections,
    items,
  })),
  errors: errorsReducer,
});

export default reducers;
