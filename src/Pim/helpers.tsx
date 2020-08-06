// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Fab } from "@material-ui/core";
import ContentAdd from "@material-ui/icons/Add";

import memoize from "memoizee";

import * as Etebase from "etebase";

import { PimType } from "../pim-types";

export const defaultColor = "#8BC34A";

export interface CachedCollection {
  collection: Etebase.Collection;
  metadata: Etebase.CollectionMetadata;
}

export function getItemNavigationUid(item: PimType) {
  // Both collectionUid and itemUid are url safe
  return `${item.collectionUid}|${item.itemUid}`;
}

export function getDecryptCollectionsFunction(_colType?: string) {
  return memoize(
    async function (collections: Etebase.Collection[]) {
      const entries: CachedCollection[] = [];
      if (collections) {
        for (const collection of collections) {
          entries.push({
            collection,
            metadata: await collection.getMeta(),
          });
        }
      }

      return entries;
    },
    { max: 1 }
  );
}

export function getDecryptItemsFunction<T extends PimType>(_colType: string, parseFunc: (str: string) => T) {
  return memoize(
    async function (items: Map<string, Map<string, Etebase.CollectionItem>>) {
      const entries: Map<string, Map<string, T>> = new Map();
      if (items) {
        for (const [colUid, col] of items.entries()) {
          const cur = new Map();
          entries.set(colUid, cur);
          for (const item of col.values()) {
            const contact = parseFunc(await item.getContent(Etebase.OutputFormat.String));
            contact.collectionUid = colUid;
            contact.itemUid = item.uid;
            cur.set(item.uid, contact);
          }
        }
      }

      return entries;
    },
    { max: 1 }
  );
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
