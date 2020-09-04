// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { Action, ActionMeta, ActionFunctionAny, combineActions, handleAction, handleActions } from "redux-actions";

import { List, Map as ImmutableMap } from "immutable";

import * as Etebase from "etebase";

import * as actions from "./actions";

interface BaseModel {
  uid: string;
}

export interface SyncCollectionsEntryData extends BaseModel {
  stoken: string;
}

export type SyncCollectionsData = ImmutableMap<string, SyncCollectionsEntryData>;

export type CacheItem = Uint8Array;
export type CacheItems = ImmutableMap<string, CacheItem>;
export type CacheItemsData = ImmutableMap<string, CacheItems>;
export type CacheCollection = Uint8Array;
export type CacheCollectionsData = ImmutableMap<string, Uint8Array>;

export type SyncGeneralData = {
  stoken: string | null;
  lastSyncDate: Date;
};

export interface CredentialsData {
  storedSession?: string;
}

export const credentials = handleActions(
  {
    [actions.login.toString()]: (
      state: CredentialsData, action: Action<string>) => {
      if (action.error) {
        return state;
      } else if (action.payload === undefined) {
        return state;
      } else {
        return {
          storedSession: action.payload,
        };
      }
    },
    [actions.logout.toString()]: (_state: CredentialsData, _action: any) => {
      return { storedSession: undefined };
    },
  },
  { storedSession: undefined }
);

export const encryptionKeyReducer = handleActions(
  {
  },
  { key: null }
);

export const syncCollections = handleActions(
  {
    [actions.setSyncCollection.toString()]: (state: SyncCollectionsData, action: Action<SyncCollectionsEntryData>) => {
      if (action.payload !== undefined) {
        return state.set(action.payload.uid, action.payload);
      }
      return state;
    },
    [actions.logout.toString()]: (state: SyncCollectionsData, _action: any) => {
      return state.clear();
    },
  },
  ImmutableMap({})
);

export const syncGeneral = handleActions(
  {
    [actions.setSyncGeneral.toString()]: (state: SyncGeneralData, action: Action<string | null | undefined>) => {
      if (action.payload !== undefined) {
        return {
          stoken: action.payload,
          lastSyncDate: new Date(),
        };
      }
      return state;
    },
    [actions.logout.toString()]: (_state: SyncGeneralData, _action: any) => {
      return {};
    },
  },
  {}
);

export const collections = handleActions(
  {
    [combineActions(
      actions.setCacheCollection,
      actions.collectionUpload,
      actions.unsetCacheCollection
    ).toString()]: (state: CacheCollectionsData, action: ActionMeta<CacheCollection, { colUid: string, deleted: boolean }>) => {
      if (action.payload !== undefined) {
        if (action.meta.deleted) {
          return state.remove(action.meta.colUid);
        } else {
          return state.set(action.meta.colUid, action.payload);
        }
      }
      return state;
    },
    [actions.logout.toString()]: (state: CacheCollectionsData, _action: any) => {
      return state.clear();
    },
  },
  ImmutableMap({})
);

export const items = handleActions(
  {
    [combineActions(
      actions.setCacheItem,
      actions.unsetCacheItem
    ).toString()]: (state: CacheItemsData, action: ActionMeta<CacheItem, { colUid: string, itemUid: string, deleted: boolean }>) => {
      if (action.payload !== undefined) {
        if (action.meta.deleted) {
          return state.removeIn([action.meta.colUid, action.meta.itemUid]);
        } else {
          return state.setIn([action.meta.colUid, action.meta.itemUid], action.payload);
        }
      }
      return state;
    },
    [combineActions(
      actions.itemBatch,
      actions.setCacheItemMulti
    ).toString()]: (state: CacheItemsData, action_: any) => {
      // Fails without it for some reason
      const action = action_ as ActionMeta<CacheItem[], { colUid: string, items: Etebase.Item[] }>;
      if (action.payload !== undefined) {
        return state.withMutations((state) => {
          let i = 0;
          for (const item of action.meta.items) {
            if (item.isDeleted) {
              state.removeIn([action.meta.colUid, item.uid]);
            } else {
              state.setIn([action.meta.colUid, item.uid], action.payload[i]);
            }
            i++;
          }
        });
      }
      return state;
    },
    [actions.setCacheCollection.toString()]: (state: CacheItemsData, action: ActionMeta<CacheCollection, { colUid: string }>) => {
      if (action.payload !== undefined) {
        if (!state.has(action.meta.colUid)) {
          return state.set(action.meta.colUid, ImmutableMap());
        }
      }
      return state;
    },
    [actions.unsetCacheCollection.toString()]: (state: CacheItemsData, action: ActionMeta<string, { colUid: string }>) => {
      if (action.payload !== undefined) {
        return state.remove(action.meta.colUid);
      }
      return state;
    },
    [actions.logout.toString()]: (state: CacheItemsData, _action: any) => {
      return state.clear();
    },
  },
  ImmutableMap({})
);

const fetchActions = [
] as Array<ActionFunctionAny<Action<any>>>;

for (const func in actions) {
  if (func.startsWith("fetch") ||
    func.startsWith("add") ||
    func.startsWith("update") ||
    func.startsWith("delete")) {

    fetchActions.push(actions[func]);
  }
}

// Indicates network activity, not just fetch
export const fetchCount = handleAction(
  combineActions(
    actions.performSync.toString(),
    ...fetchActions
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

export const errorsReducer = handleActions(
  {
    [combineActions(
      actions.performSync
    ).toString()]: (state: List<Error>, action: Action<any>) => {
      if (action.error) {
        return state.push(action.payload);
      }

      return state;
    },
    [actions.appendError.toString()]: (state: List<Error>, action: Action<any>) => {
      if (Array.isArray(action.payload)) {
        return state.push(...action.payload);
      } else {
        return state.push(action.payload);
      }
    },
    [actions.clearErros.toString()]: (state: List<Error>, _action: Action<any>) => {
      return state.clear();
    },
  },
  List([])
);


// FIXME Move all the below (potentially the fetchCount ones too) to their own file
export interface SettingsType {
  locale: string;
  darkMode?: boolean;
  taskSettings: {
    filterBy: string | null;
    sortBy: string;
  };
}

export const settingsReducer = handleActions(
  {
    [actions.setSettings.toString()]: (state: { key: string | null }, action: any) => (
      { ...state, ...action.payload }
    ),
  },
  {
    locale: "en-gb",
    darkMode: false,
    taskSettings: {
      filterBy: null,
      sortBy: "smart",
    },
  }
);
