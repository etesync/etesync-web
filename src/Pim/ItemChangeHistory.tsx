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
import LoadingIndicator from "../widgets/LoadingIndicator";
import GenericChangeHistory from "../components/GenericChangeHistory";
import { useItems } from "../etebase-helpers";
import { CachedCollection } from "./helpers";

export interface CachedItem {
  item: Etebase.Item;
  metadata: Etebase.ItemMetadata;
  content: string;
}

async function loadRevisions(etebase: Etebase.Account, col: Etebase.Collection, item: Etebase.Item) {
  const ret: CachedItem[] = [];
  const colMgr = etebase.getCollectionManager();
  const itemManager = colMgr.getItemManager(col);

  let iterator: string | null = null;
  let done = false;
  while (!done) {
    // FIXME: shouldn't be any
    const revisions: any = await itemManager.itemRevisions(item, { iterator, limit: 30 });
    iterator = revisions.iterator;
    done = revisions.done;

    for (const item of revisions.data) {
      ret.push({
        item,
        metadata: await item.getMeta(),
        content: await item.getContent(Etebase.OutputFormat.String),
      });
    }
  }

  return ret;
}

interface PropsType {
  collection: CachedCollection;
  itemUid: string;
}

export default function ItemChangeHistory(props: PropsType) {
  const [entries, setEntries] = React.useState<CachedItem[]>();
  const [dialog, setDialog] = React.useState<CachedItem>();
  const etebase = useCredentials()!;
  const { collection, metadata } = props.collection;
  const items = useItems(etebase, metadata.type);

  const item = items?.get(collection.uid)?.get(props.itemUid);

  React.useEffect(() => {
    if (item) {
      loadRevisions(etebase, collection, item)
        .then((entries) => setEntries(entries));
    }
  }, [etebase, collection, item]);

  if (!entries) {
    return (
      <LoadingIndicator />
    );
  }

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
          <div>Revision UID: <pre className="d-inline-block">{dialog?.item.etag}</pre></div>
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
        items={entries}
        onItemClick={setDialog}
      />
    </div>
  );
}

