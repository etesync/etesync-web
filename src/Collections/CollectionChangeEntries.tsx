// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import * as Etebase from "etebase";

import { useCredentials } from "../credentials";
import { useItems } from "../etebase-helpers";
import { CachedCollection, getRawItemNavigationUid } from "../Pim/helpers";
import LoadingIndicator from "../widgets/LoadingIndicator";
import GenericChangeHistory from "../components/GenericChangeHistory";
import { useHistory } from "react-router";
import { routeResolver } from "../App";

export interface CachedItem {
  item: Etebase.Item;
  metadata: Etebase.ItemMetadata;
  content: string;
}

// FIXME: use the ones used by e.g. Contacts/Main so ew share the cache.
// Only problem though is that we want the deleted items here and not there.
async function decryptItems(items: Map<string, Map<string, Etebase.Item>>) {
  const entries: Map<string, Map<string, CachedItem>> = new Map();
  for (const [colUid, col] of items.entries()) {
    const cur = new Map();
    entries.set(colUid, cur);
    for (const item of col.values()) {
      cur.set(item.uid, {
        item,
        metadata: item.getMeta(),
        content: await item.getContent(Etebase.OutputFormat.String),
      });
    }
  }

  return entries;
}

interface PropsType {
  collection: CachedCollection;
}

export default function CollectionChangeEntries(props: PropsType) {
  const [entries, setEntries] = React.useState<Map<string, CachedItem>>();
  const history = useHistory();
  const etebase = useCredentials()!;

  const { collection, collectionType } = props.collection;
  const items = useItems(etebase, collectionType);

  React.useEffect(() => {
    if (items) {
      decryptItems(items)
        .then((entries) => setEntries(entries.get(collection.uid)));
    }
  }, [items]);

  if (!entries) {
    return (
      <LoadingIndicator />
    );
  }

  const entriesList = Array.from(entries.values()).sort((a_, b_) => {
    const a = a_.metadata.mtime ?? 0;
    const b = b_.metadata.mtime ?? 0;
    return a - b;
  });

  let changelogRoute = "";
  switch (collectionType) {
    case "etebase.vevent": {
      changelogRoute = "pim.events._id.log";
      break;
    }
    case "etebase.vtodo": {
      changelogRoute = "pim.tasks._id.log";
      break;
    }
    case "etebase.vcard": {
      changelogRoute = "pim.contacts._id.log";
      break;
    }
  }

  return (
    <div style={{ height: "calc(100vh - 300px)" }}>
      <GenericChangeHistory
        items={entriesList}
        onItemClick={(item) =>
          history.push(routeResolver.getRoute(changelogRoute, { itemUid: getRawItemNavigationUid(collection.uid, item.item.uid) }))
        }
      />
    </div>
  );
}
