// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import * as Etebase from "etebase";

import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

import { useCredentials } from "../credentials";
import { useItems } from "../etebase-helpers";
import { CachedCollection } from "../Pim/helpers";
import LoadingIndicator from "../widgets/LoadingIndicator";
import GenericChangeHistory from "../components/GenericChangeHistory";

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
        metadata: await item.getMeta(),
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
  const [dialog, setDialog] = React.useState<CachedItem>();
  const etebase = useCredentials()!;

  const { collection, metadata } = props.collection;
  const colType = metadata.type;
  const items = useItems(etebase, colType);

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

  return (
    <div style={{ height: "calc(100vh - 300px)" }}>
      <Dialog
        open={dialog !== undefined}
        onClose={() => setDialog(undefined)}
      >
        <DialogTitle>
          Raw Content
        </DialogTitle>
        <DialogContent>
          <div>Entry UID: <pre className="d-inline-block">{dialog?.item.uid}</pre></div>
          <div>Content:
            <pre>{dialog?.content}</pre>
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            onClick={() => setDialog(undefined)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <GenericChangeHistory
        items={entriesList}
        onItemClick={setDialog}
      />
    </div>
  );
}
