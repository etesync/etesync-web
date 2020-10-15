// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Fab } from "@material-ui/core";
import ContentAdd from "@material-ui/icons/Add";

import memoize from "memoizee";

import * as Etebase from "etebase";

import { PimType } from "../pim-types";
import { getCollectionManager } from "../etebase-helpers";
import { asyncDispatch, store } from "../store";
import { itemBatch, appendError } from "../store/actions";

export const defaultColor = "#8BC34A";

export interface CachedCollection {
  collection: Etebase.Collection;
  metadata: Etebase.ItemMetadata;
  collectionType: string;
}

export function getRawItemNavigationUid(collectionUid: string, itemUid: string) {
  // Both collectionUid and itemUid are url safe
  return `${collectionUid}|${itemUid}`;
}

export function getItemNavigationUid(item: PimType) {
  return getRawItemNavigationUid(item.collectionUid!, item.itemUid!);
}

export function getDecryptCollectionsFunction(_colType?: string) {
  return memoize(
    async function (collections: Etebase.Collection[]) {
      const entries: CachedCollection[] = [];
      if (collections) {
        for (const collection of collections) {
          try {
            entries.push({
              collection,
              metadata: await collection.getMeta(),
              collectionType: await collection.getCollectionType(),
            });
          } catch (e) {
            store.dispatch(appendError(e));
          }
        }
      }

      return entries;
    },
    { max: 1 }
  );
}

export function getDecryptItemsFunction<T extends PimType>(_colType: string, parseFunc: (str: string) => T) {
  return memoize(
    async function (items: Map<string, Map<string, Etebase.Item>>) {
      const entries: Map<string, Map<string, T>> = new Map();
      if (items) {
        for (const [colUid, col] of items.entries()) {
          const cur = new Map();
          entries.set(colUid, cur);
          for (const item of col.values()) {
            if (item.isDeleted) {
              continue;
            }
            try {
              const contact = parseFunc(await item.getContent(Etebase.OutputFormat.String));
              contact.collectionUid = colUid;
              contact.itemUid = item.uid;
              cur.set(item.uid, contact);
            } catch (e) {
              store.dispatch(appendError(e));
            }
          }
        }
      }

      return entries;
    },
    { max: 1 }
  );
}

export async function itemSave(etebase: Etebase.Account, collection: Etebase.Collection, items: Map<string, Map<string, Etebase.Item>>, item: PimType, collectionUid: string, originalItem?: PimType): Promise<void> {
  const itemUid = originalItem?.itemUid;
  const colMgr = getCollectionManager(etebase);
  const itemMgr = colMgr.getItemManager(collection);

  const mtime = (new Date()).getTime();
  const content = item.toIcal();

  let eteItem;
  if (itemUid) {
    // Existing item
    eteItem = items!.get(collectionUid)?.get(itemUid)!;
    await eteItem.setContent(content);
    const meta = await eteItem.getMeta();
    meta.mtime = mtime;
    await eteItem.setMeta(meta);
  } else {
    // New
    const meta: Etebase.ItemMetadata = {
      mtime,
      name: item.uid,
    };
    eteItem = await itemMgr.create(meta, content);
  }

  await asyncDispatch(itemBatch(collection, itemMgr, [eteItem]));
}

export async function itemDelete(etebase: Etebase.Account, collection: Etebase.Collection, items: Map<string, Map<string, Etebase.Item>>, item: PimType, collectionUid: string) {
  const itemUid = item.itemUid!;
  const colMgr = getCollectionManager(etebase);
  const itemMgr = colMgr.getItemManager(collection);

  const eteItem = items!.get(collectionUid)?.get(itemUid)!;
  const mtime = (new Date()).getTime();
  const meta = await eteItem.getMeta();
  meta.mtime = mtime;
  await eteItem.setMeta(meta);
  await eteItem.delete(true);

  await asyncDispatch(itemBatch(collection, itemMgr, [eteItem]));
}

interface PimFabPropsType {
  onClick: () => void;
}

export function PimFab(props: PimFabPropsType) {
  const style = {
    floatingButton: {
      margin: 0,
      top: "auto",
      right: 20,
      bottom: 20,
      left: "auto",
      position: "fixed",
    },
  };

  return (
    <Fab
      color="primary"
      style={style.floatingButton as any}
      onClick={props.onClick}
    >
      <ContentAdd />
    </Fab>
  );
}
