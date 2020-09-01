import memoize from "memoizee";

import * as Etebase from "etebase";
import { useSelector } from "react-redux";

import { StoreState } from "./store";
import { CacheCollectionsData, CacheItems, CacheItemsData } from "./store/reducers";
import { usePromiseMemo } from "./helpers";

export const getCollections = memoize(async function (cachedCollections: CacheCollectionsData, etebase: Etebase.Account) {
  const colMgr = getCollectionManager(etebase);
  const ret: Etebase.Collection[] = [];
  for (const cached of cachedCollections.values()) {
    ret.push(await colMgr.cacheLoad(cached));
  }
  return ret;
}, { length: 1 });

export const getCollectionsByType = memoize(async function (cachedCollections: CacheCollectionsData, colType: string, etebase: Etebase.Account) {
  const collections = await getCollections(cachedCollections, etebase);
  const ret: Etebase.Collection[] = [];
  for (const col of collections) {
    const meta = await col.getMeta();
    if (meta.type === colType) {
      ret.push(col);
    }
  }
  return ret;
}, { length: 2 });

export const getItems = memoize(async function (cachedItems: CacheItems, itemMgr: Etebase.ItemManager) {
  const ret = new Map<string, Etebase.Item>();
  for (const cached of cachedItems.values()) {
    const item = await itemMgr.cacheLoad(cached);
    ret.set(item.uid, item);
  }
  return ret;
}, { length: 1 });

export const getItemsByType = memoize(async function (cachedCollections: CacheCollectionsData, cachedItems: CacheItemsData, colType: string, etebase: Etebase.Account) {
  const colMgr = getCollectionManager(etebase);
  const collections = await getCollectionsByType(cachedCollections, colType, etebase);
  const ret = new Map<string, Map<string, Etebase.Item>>();
  for (const col of collections) {
    const itemMgr = colMgr.getItemManager(col);
    const cachedColItems = cachedItems.get(col.uid);
    if (cachedColItems) {
      const items = await getItems(cachedColItems, itemMgr);
      ret.set(col.uid, items);
    }
  }
  return ret;
}, { length: 3 });

export const getCollectionManager = memoize(function (etebase: Etebase.Account) {
  return etebase.getCollectionManager();
});

// React specific stuff
export function useCollections(etebase: Etebase.Account, colType?: string) {
  const cachedCollections = useSelector((state: StoreState) => state.cache.collections);
  return usePromiseMemo(
    (colType) ?
      getCollectionsByType(cachedCollections, colType, etebase) :
      getCollections(cachedCollections, etebase),
    [etebase, cachedCollections, colType]
  );
}

export function useItems(etebase: Etebase.Account, colType: string) {
  const cachedCollections = useSelector((state: StoreState) => state.cache.collections);
  const cachedItems = useSelector((state: StoreState) => state.cache.items);
  return usePromiseMemo(
    getItemsByType(cachedCollections, cachedItems, colType, etebase),
    [etebase, cachedCollections, cachedItems, colType]
  );
}
