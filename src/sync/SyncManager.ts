// SPDX-FileCopyrightText: © 2019 EteSync Authors
// SPDX-License-Identifier: GPL-3.0-only

import * as Etebase from "etebase";

import { store, StoreState } from "../store";

import { credentialsSelector } from "../credentials";
import { setSyncCollection, setSyncGeneral, setCacheCollection, unsetCacheCollection, setCacheItemMulti } from "../store/actions";

const cachedSyncManager = new Map<string, SyncManager>();
export class SyncManager {
  private COLLECTION_TYPES = ["etebase.vcard", "etebase.vevent", "etebase.vtodo"];
  private BATCH_SIZE = 40;

  public static getManager(etebase: Etebase.Account) {
    const cached = cachedSyncManager.get(etebase.user.username);
    if (cached) {
      return cached;
    }

    const ret = new SyncManager();
    cachedSyncManager.set(etebase.user.username, ret);
    return ret;
  }

  public static removeManager(etebase: Etebase.Account) {
    cachedSyncManager.delete(etebase.user.username);
  }

  protected etebase: Etebase.Account;
  protected isSyncing: boolean;

  public async fetchCollection(col: Etebase.Collection) {
    const storeState = store.getState() as unknown as StoreState;
    const etebase = (await credentialsSelector(storeState))!;
    const syncCollection = storeState.sync.collections.get(col.uid, undefined);

    const colMgr = etebase.getCollectionManager();
    const itemMgr = colMgr.getItemManager(col);

    let stoken = syncCollection?.stoken;
    const limit = this.BATCH_SIZE;
    let done = false;
    while (!done) {
      const items = await itemMgr.list({ stoken, limit });
      store.dispatch(setCacheItemMulti(col.uid, itemMgr, items.data));
      done = items.done;
      stoken = items.stoken;
    }

    if (syncCollection?.stoken !== stoken) {
      store.dispatch(setSyncCollection(col.uid, stoken!));
    }
  }

  public async fetchAllCollections() {
    const storeState = store.getState() as unknown as StoreState;
    const etebase = (await credentialsSelector(storeState))!;
    const syncGeneral = storeState.sync.general;

    const colMgr = etebase.getCollectionManager();
    const limit = this.BATCH_SIZE;
    let stoken = syncGeneral?.stoken;
    let done = false;
    while (!done) {
      const collections = await colMgr.list({ stoken, limit });
      for (const col of collections.data) {
        const meta = await col.getMeta();
        if (this.COLLECTION_TYPES.includes(meta.type)) {
          // We only get the changed collections here, so always fetch
          if (col.isDeleted) {
            store.dispatch(unsetCacheCollection(colMgr, col.uid));
          } else {
            store.dispatch(setCacheCollection(colMgr, col));
          }
          await this.fetchCollection(col);
        }
      }
      if (collections.removedMemberships) {
        for (const removed of collections.removedMemberships) {
          store.dispatch(unsetCacheCollection(colMgr, removed.uid));
        }
      }
      done = collections.done;
      stoken = collections.stoken;
    }

    if (syncGeneral?.stoken !== stoken) {
      store.dispatch(setSyncGeneral(stoken));
    }
    return true;
  }

  public async sync() {
    if (this.isSyncing) {
      return false;
    }
    this.isSyncing = true;

    try {
      const stoken = await this.fetchAllCollections();
      return stoken;
    } catch (e) {
      if (e instanceof Etebase.NetworkError) {
        // Ignore network errors
        return null;
      } else if (e instanceof Etebase.HTTPError) {
        switch (e.status) {
          case 401: // INVALID TOKEN
          case 403: // FORBIDDEN
          case 503: // UNAVAILABLE
            // FIXME store.dispatch(addNonFatalError(this.etebase, e));
            return null;
        }
      }
      throw e;
    } finally {
      this.isSyncing = false;
    }
  }
}
