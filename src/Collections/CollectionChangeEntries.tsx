// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import moment from "moment";

import * as Etebase from "etebase";

import { AutoSizer, List as VirtualizedList } from "react-virtualized";

import { List, ListItem } from "../widgets/List";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import IconEdit from "@material-ui/icons/Edit";
import IconDelete from "@material-ui/icons/Delete";
import IconError from "@material-ui/icons/Error";

import { useCredentials } from "../credentials";
import { useItems } from "../etebase-helpers";
import { TaskType, EventType, ContactType, parseString } from "../pim-types";
import { CachedCollection } from "../Pim/helpers";
import LoadingIndicator from "../widgets/LoadingIndicator";

export interface CachedItem {
  item: Etebase.CollectionItem;
  metadata: Etebase.CollectionItemMetadata;
  content: string;
}

async function decryptItems(items: Map<string, Map<string, Etebase.CollectionItem>>) {
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

// FIXME: use the ones used by e.g. Contacts/Main so ew share the cache
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

  const rowRenderer = (params: { index: number, key: string, style: React.CSSProperties }) => {
    const { key, index, style } = params;
    const cacheItem = entriesList[entriesList.length - index - 1]!;
    let comp;
    try {
      comp = parseString(cacheItem.content);
    } catch (e) {
      const icon = (<IconError style={{ color: "red" }} />);
      return (
        <ListItem
          key={key}
          style={style}
          leftIcon={icon}
          primaryText="Failed parsing item"
          secondaryText="Unknown"
          onClick={() => setDialog(cacheItem)}
        />
      );
    }

    let icon;
    if (!cacheItem.item.isDeleted) {
      icon = (<IconEdit style={{ color: "#16B14B" }} />);
    } else {
      icon = (<IconDelete style={{ color: "#F20C0C" }} />);
    }

    let name;
    if (comp.name === "vcalendar") {
      if (EventType.isEvent(comp)) {
        const vevent = EventType.fromVCalendar(comp);
        name = vevent.summary;
      } else {
        const vtodo = TaskType.fromVCalendar(comp);
        name = vtodo.summary;
      }
    } else if (comp.name === "vcard") {
      const vcard = new ContactType(comp);
      name = vcard.fn;
    } else {
      name = "Error processing entry";
    }

    const mtime = (cacheItem.metadata.mtime) ? moment(cacheItem.metadata.mtime) : undefined;

    return (
      <ListItem
        key={key}
        style={style}
        leftIcon={icon}
        primaryText={name}
        secondaryText={mtime && mtime.format("llll")}
        onClick={() => setDialog(cacheItem)}
      />
    );
  };

  return (
    <div>
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
      <List style={{ height: "calc(100vh - 300px)" }}>
        <AutoSizer>
          {({ height, width }) => (
            <VirtualizedList
              width={width}
              height={height}
              rowCount={entriesList.length}
              rowHeight={56}
              rowRenderer={rowRenderer}
            />
          )}
        </AutoSizer>
      </List>
    </div>
  );
}
