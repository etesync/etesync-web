// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { createAction } from "redux-actions";

import * as Etebase from "etebase";

import { SettingsType } from "./";

export const resetKey = createAction(
  "RESET_KEY",
  () => {
    return null;
  }
);

export const logout = createAction(
  "LOGOUT",
  async (etebase: Etebase.Account) => {
    await etebase.logout();
  }
);

export const login = createAction(
  "LOGIN",
  async (username: string, password: string, server: string) => {
    const etebase = await Etebase.Account.login(username, password, server);
    return etebase.save();
  }
);

export const setCacheCollection = createAction(
  "SET_CACHE_COLLECTION",
  async (colMgr: Etebase.CollectionManager, col: Etebase.Collection) => {
    return Etebase.toBase64(await colMgr.cacheSave(col));
  },
  (_colMgr: Etebase.CollectionManager, col: Etebase.Collection) => {
    return {
      colUid: col.uid,
    };
  }
);

export const unsetCacheCollection = createAction(
  "UNSET_CACHE_COLLECTION",
  (_colMgr: Etebase.CollectionManager, colUid: string) => {
    return {
      colUid,
    };
  }
);

export const setCacheItem = createAction(
  "SET_CACHE_ITEM",
  async (_col: Etebase.Collection, itemMgr: Etebase.CollectionItemManager, item: Etebase.CollectionItem) => {
    return Etebase.toBase64(await itemMgr.cacheSave(item));
  },
  (col: Etebase.Collection, _itemMgr: Etebase.CollectionItemManager, item: Etebase.CollectionItem) => {
    return {
      colUid: col.uid,
      itemUid: item.uid,
    };
  }
);

export const unsetCacheItem = createAction(
  "UNSET_CACHE_ITEM",
  (_colUid: string, _itemMgr: Etebase.CollectionItemManager, itemUid: string) => {
    return itemUid;
  },
  (colUid: string, _itemMgr: Etebase.CollectionItemManager, itemUid: string) => {
    return {
      colUid,
      itemUid,
    };
  }
);

export const setSyncCollection = createAction(
  "SET_SYNC_COLLECTION",
  (colUid: string, stoken: string) => {
    return {
      colUid,
      stoken,
    };
  }
);

export const setSyncGeneral = createAction(
  "SET_SYNC_GENERAL",
  (stoken: string | null) => {
    return stoken;
  }
);

export const performSync = createAction(
  "PERFORM_SYNC",
  (syncPromise: Promise<any>) => {
    return syncPromise;
  }
);

export const appendError = createAction(
  "APPEND_ERROR",
  (_etesync: Etebase.Account, error: Error | Error[]) => {
    return Array.isArray(error) ? error : [error];
  }
);

export const clearErros = createAction(
  "CLEAR_ERRORS",
  (_etesync: Etebase.Account) => {
    return true;
  }
);

// FIXME: Move the rest to their own file
export const setSettings = createAction(
  "SET_SETTINGS",
  (settings: Partial<SettingsType>) => {
    return { ...settings };
  }
);
