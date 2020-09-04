// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { createAction as origCreateAction, ActionMeta } from "redux-actions";

import * as Etebase from "etebase";

import { SettingsType } from "./";

type FunctionAny = (...args: any[]) => any;

function createAction<Func extends FunctionAny, MetaFunc extends FunctionAny>(
  actionType: string,
  payloadCreator: Func,
  metaCreator?: MetaFunc
): (..._params: Parameters<Func>) => ActionMeta<ReturnType<Func>, ReturnType<MetaFunc>> {
  return origCreateAction(actionType, payloadCreator, metaCreator as any) as any;
}

export const resetKey = createAction(
  "RESET_KEY",
  () => {
    return null;
  }
);

export const logout = createAction(
  "LOGOUT",
  async (etebase: Etebase.Account) => {
    // We don't wait on purpose, because we would like to logout and clear local data anyway
    etebase.logout();
  }
);

export const login = createAction(
  "LOGIN",
  async (etebase: Etebase.Account) => {
    return etebase.save();
  }
);

export const setCacheCollection = createAction(
  "SET_CACHE_COLLECTION",
  async (colMgr: Etebase.CollectionManager, col: Etebase.Collection) => {
    return await colMgr.cacheSave(col);
  },
  (_colMgr: Etebase.CollectionManager, col: Etebase.Collection) => {
    return {
      colUid: col.uid,
      deleted: col.isDeleted,
    };
  }
);

export const unsetCacheCollection = createAction(
  "UNSET_CACHE_COLLECTION",
  (_colMgr: Etebase.CollectionManager, _colUid: string) => {
    return undefined;
  },
  (_colMgr: Etebase.CollectionManager, colUid: string) => {
    return {
      colUid,
      deleted: true,
    };
  }
);

export const collectionUpload = createAction(
  "COLLECTION_UPLOAD",
  async (colMgr: Etebase.CollectionManager, col: Etebase.Collection) => {
    await colMgr.upload(col);
    return await colMgr.cacheSave(col);
  },
  (_colMgr: Etebase.CollectionManager, col: Etebase.Collection) => {
    return {
      colUid: col.uid,
      deleted: col.isDeleted,
    };
  }
);

export const setCacheItem = createAction(
  "SET_CACHE_ITEM",
  async (_col: Etebase.Collection, itemMgr: Etebase.ItemManager, item: Etebase.Item) => {
    return await itemMgr.cacheSave(item);
  },
  (col: Etebase.Collection, _itemMgr: Etebase.ItemManager, item: Etebase.Item) => {
    return {
      colUid: col.uid,
      itemUid: item.uid,
      deleted: item.isDeleted,
    };
  }
);

export const unsetCacheItem = createAction(
  "UNSET_CACHE_ITEM",
  (_colUid: string, _itemMgr: Etebase.ItemManager, itemUid: string) => {
    return itemUid;
  },
  (colUid: string, _itemMgr: Etebase.ItemManager, itemUid: string) => {
    return {
      colUid,
      itemUid,
      deleted: true,
    };
  }
);

export const setCacheItemMulti = createAction(
  "SET_CACHE_ITEM_MULTI",
  async (_colUid: string, itemMgr: Etebase.ItemManager, items: Etebase.Item[]) => {
    const ret = [];
    for (const item of items) {
      ret.push(await itemMgr.cacheSave(item));
    }
    return ret;
  },
  (colUid: string, _itemMgr: Etebase.ItemManager, items: Etebase.Item[], _deps?: Etebase.Item[]) => {
    return {
      colUid,
      items: items,
    };
  }
);

export const itemBatch = createAction(
  "ITEM_BATCH",
  async (_col: Etebase.Collection, itemMgr: Etebase.ItemManager, items: Etebase.Item[], deps?: Etebase.Item[]) => {
    await itemMgr.batch(items, deps);
    const ret = [];
    for (const item of items) {
      ret.push(await itemMgr.cacheSave(item));
    }
    return ret;
  },
  (col: Etebase.Collection, _itemMgr: Etebase.ItemManager, items: Etebase.Item[], _deps?: Etebase.Item[]) => {
    return {
      colUid: col.uid,
      items: items,
    };
  }
);

export const setSyncCollection = createAction(
  "SET_SYNC_COLLECTION",
  (uid: string, stoken: string) => {
    return {
      uid,
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
  (error: Error | Error[]) => {
    return error;
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
