// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { Action, ActionMeta, ActionFunctionAny, combineActions, handleAction, handleActions } from "redux-actions";
import { shallowEqual } from "react-redux";

import { List, Map as ImmutableMap } from "immutable";

import * as EteSync from "etesync";

import * as actions from "./actions";

export type JournalsData = ImmutableMap<string, EteSync.Journal>;

export type EntriesListData = List<EteSync.Entry>;
export type EntriesData = ImmutableMap<string, EntriesListData>;

export type UserInfoData = EteSync.UserInfo;

export interface CredentialsDataRemote {
  serviceApiUrl: string;
  credentials: EteSync.Credentials;
}

export interface CredentialsData extends CredentialsDataRemote {
  encryptionKey: string;
}

interface BaseModel {
  uid: string;
}

export interface SyncCollectionsEntryData extends BaseModel {
  stoken: string;
}

export type SyncCollectionsData = ImmutableMap<string, SyncCollectionsEntryData>;

export type CacheItem = string;
export type CacheItems = ImmutableMap<string, CacheItem>;
export type CacheItemsData = ImmutableMap<string, CacheItems>;
export type CacheCollection = CacheItem;
export type CacheCollectionsData = ImmutableMap<string, CacheCollection>;

export type SyncGeneralData = {
  stoken: string | null;
  lastSyncDate: Date;
};

export interface CredentialsData2 {
  storedSession?: string;
}

export const credentials = handleActions(
  {
    [actions.login.toString()]: (
      state: CredentialsData2, action: Action<string>) => {
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
    [actions.logout.toString()]: (_state: CredentialsData2, _action: any) => {
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
    [actions.setCacheCollection.toString()]: (state: CacheCollectionsData, action: ActionMeta<CacheCollection, { colUid: string }>) => {
      if (action.payload !== undefined) {
        return state.set(action.meta.colUid, action.payload);
      }
      return state;
    },
    [actions.unsetCacheCollection.toString()]: (state: CacheCollectionsData, action: ActionMeta<string, { colUid: string }>) => {
      if (action.payload !== undefined) {
        return state.remove(action.meta.colUid);
      }
      return state;
    },
  },
  ImmutableMap({})
);

export const items = handleActions(
  {
    [actions.setCacheItem.toString()]: (state: CacheItemsData, action: ActionMeta<CacheItem, { colUid: string, itemUid: string }>) => {
      if (action.payload !== undefined) {
        return state.setIn([action.meta.colUid, action.meta.itemUid], action.payload);
      }
      return state;
    },
    [actions.unsetCacheItem.toString()]: (state: CacheItemsData, action: ActionMeta<string, { colUid: string, itemUid: string }>) => {
      if (action.payload !== undefined) {
        return state.removeIn([action.meta.colUid, action.meta.itemUid]);
      }
      return state;
    },
    [actions.unsetCacheCollection.toString()]: (state: CacheItemsData, action: ActionMeta<string, { colUid: string }>) => {
      if (action.payload !== undefined) {
        return state.remove(action.meta.colUid);
      }
      return state;
    },
  },
  ImmutableMap({})
);

function entriesListSetExtend(
  state: List<any> | undefined, action: Action<EteSync.Entry[]>, extend = false) {
  state = state ?? List([]);

  if (action.error) {
    return state;
  } else {
    const payload = action.payload ?? null;

    if (!payload) {
      return state;
    }

    if (extend && (state !== null)) {
      if (payload !== null) {
        state = state.concat(payload);
      }
    } else if (payload !== null) {
      state = List(payload);
    }
    return state;
  }
}

function fetchCreateEntriesReducer(state: EntriesData, action: any) {
  const prevState = state.get(action.meta.journal);
  const extend = action.meta.prevUid !== null;
  return state.set(action.meta.journal,
    entriesListSetExtend(prevState, action, extend));
}

export const entries = handleActions(
  {
    [actions.fetchEntries.toString()]: fetchCreateEntriesReducer,
    [actions.addEntries.toString()]: fetchCreateEntriesReducer,
    [actions.addJournal.toString()]: (state: EntriesData, action: any) => {
      const journal = action.meta.item.uid;
      return state.set(journal, List([]));
    },
    [actions.logout.toString()]: (state: EntriesData, _action: any) => {
      return state.clear();
    },
  },
  ImmutableMap({})
);

const setMapModelReducer = (state: JournalsData, action: Action<EteSync.Journal[]>) => {
  if (action.error || !action.payload) {
    return state;
  }

  state = state ?? ImmutableMap<string, EteSync.Journal>().asMutable();
  const old = state.asMutable();

  return state.withMutations((ret) => {
    const items = action.payload!;
    for (const item of items) {
      const current = old.get(item.uid);
      if (!current || !shallowEqual(current.serialize(), item.serialize())) {
        ret.set(item.uid, item);
      }

      if (current) {
        old.delete(item.uid);
      }
    }

    // Delete all the items that were deleted remotely (not handled above).
    for (const uid of old.keys()) {
      ret.delete(uid);
    }
  });
};

const addEditMapModelReducer = (state: JournalsData, action: ActionMeta<EteSync.Journal, { item: EteSync.Journal }>) => {
  if (action.error) {
    return state;
  } else {
    let payload = (action.payload === undefined) ? null : action.payload;
    payload = (action.meta === undefined) ? payload : action.meta.item;

    if (!payload) {
      return state;
    }

    const item = payload;
    return state.set(item.uid, item);
  }
};

const deleteMapModelReducer = (state: JournalsData, action: ActionMeta<EteSync.Journal, { item: EteSync.Journal }>) => {
  if (action.error) {
    return state;
  } else {
    let payload = (action.payload === undefined) ? null : action.payload;
    payload = (action.meta === undefined) ? payload : action.meta.item;

    if (!payload) {
      return state;
    }

    const uid = payload.uid;
    return state.delete(uid);
  }
};

export const journals = handleActions(
  {
    [actions.fetchListJournal.toString()]: setMapModelReducer as any,
    [actions.addJournal.toString()]: addEditMapModelReducer,
    [actions.updateJournal.toString()]: addEditMapModelReducer,
    [actions.deleteJournal.toString()]: deleteMapModelReducer,
    [actions.logout.toString()]: (state: JournalsData, _action: any) => {
      return state.clear();
    },
  },
  ImmutableMap({})
);

export const userInfo = handleActions(
  {
    [combineActions(
      actions.fetchUserInfo,
      actions.createUserInfo
    ).toString()]: (state: UserInfoData | null, action: any) => {
      if (action.error) {
        return state;
      } else {
        let payload = action.payload ?? null;

        if (payload === null) {
          return state;
        }

        payload = action.meta?.userInfo ?? payload;

        if (!state || !shallowEqual(state.serialize(), payload.serialize())) {
          return payload;
        }

        return state;
      }
    },
    [actions.logout.toString()]: (_state: any, _action: any) => {
      return null;
    },
  },
  null
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
      actions.fetchListJournal,
      actions.addJournal,
      actions.updateJournal,
      actions.deleteJournal,
      actions.fetchEntries,
      actions.addEntries
    ).toString()]: (state: List<Error>, action: Action<any>) => {
      if (action.error) {
        return state.push(action.payload);
      }

      return state;
    },
    [actions.appendError.toString()]: (state: List<Error>, action: Action<any>) => {
      return state.push(...action.payload);
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
