// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as Immutable from "immutable";

import { AutoSizer, List as VirtualizedList } from "react-virtualized";

import * as React from "react";
import { List, ListItem } from "../widgets/List";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import IconAdd from "@material-ui/icons/Add";
import IconDelete from "@material-ui/icons/Delete";
import IconEdit from "@material-ui/icons/Edit";
import IconError from "@material-ui/icons/Error";

import { TaskType, EventType, ContactType, parseString } from "../pim-types";

import * as EteSync from "etesync";
import LoadingIndicator from "../widgets/LoadingIndicator";
import { useCredentials } from "../login";
import { createJournalEntry } from "../etesync-helpers";
import { useSelector, useDispatch } from "react-redux";
import { StoreState } from "../store";
import { addEntries } from "../store/actions";

interface RollbackToHereDialogPropsType {
  journal: EteSync.Journal;
  entries: Immutable.List<EteSync.SyncEntry>;
  entryUid: string;
  open: boolean;
  onClose: () => void;
}

function RollbackToHereDialog(props: RollbackToHereDialogPropsType) {
  const [loading, setLoading] = React.useState(false);
  const etesync = useCredentials()!;
  const dispatch = useDispatch();
  const userInfo = useSelector((state: StoreState) => state.cache.userInfo);

  async function go() {
    setLoading(true);

    const changes = new Map<string, EteSync.SyncEntry>();

    for (const entry of props.entries.reverse()) {
      const comp = parseString(entry.content);
      const itemComp = comp.getFirstSubcomponent("vevent") ?? comp.getFirstSubcomponent("vtodo") ?? comp;
      const itemUid = itemComp.getFirstPropertyValue("uid");

      if (itemUid && !changes.has(itemUid)) {
        changes.set(itemUid, entry);
      }

      if (entry.uid === props.entryUid) {
        break;
      }
    }

    const last = props.entries.last(null);
    const lastUid = last?.uid ? last.uid : null;

    // XXX implement chunked push most likely...
    let prevUid = lastUid;
    const journalItems = [];
    for (const syncEntry of changes.values()) {
      if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
        const ret = createJournalEntry(etesync, userInfo, props.journal, prevUid, EteSync.SyncEntryAction.Add, syncEntry.content);
        journalItems.push(ret);

        prevUid = ret.uid;
      }
    }

    if (journalItems.length > 0) {
      await dispatch<any>(
        addEntries(etesync, props.journal.uid, journalItems, lastUid)
      );
    }

    props.onClose();
  }

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle>
        Recover items
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <LoadingIndicator style={{ display: "block", margin: "auto" }} />
        ) : (
          <p>
            This function restores all of the deleted items that happened after this change entry. It will not modify any items that haven't been changed since the item was deleted.
          </p>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          disabled={loading}
          onClick={props.onClose}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          disabled={loading}
          onClick={go}
        >
          Go
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface PropsType {
  journal: EteSync.Journal;
  entries: Immutable.List<EteSync.SyncEntry>;
  uid?: string;
}

export default function JournalEntries(props: PropsType) {
  const [dialog, setDialog] = React.useState<EteSync.SyncEntry>();
  const [rollbackDialogId, setRollbackDialogId] = React.useState<string>();

  if (props.journal === undefined) {
    return (<div>Loading</div>);
  }

  const rowRenderer = (params: { index: number, key: string, style: React.CSSProperties }) => {
    const { key, index, style } = params;
    // eslint-disable-next-line react/prop-types
    const syncEntry = props.entries.get(props.entries.size - index - 1)!;
    let comp;
    try {
      comp = parseString(syncEntry.content);
    } catch (e) {
      const icon = (<IconError style={{ color: "red" }} />);
      return (
        <ListItem
          key={key}
          style={style}
          leftIcon={icon}
          primaryText="Failed parsing item"
          secondaryText="Unknown"
          onClick={() => setDialog(syncEntry)}
        />
      );
    }

    let icon;
    if (syncEntry.action === EteSync.SyncEntryAction.Add) {
      icon = (<IconAdd style={{ color: "#16B14B" }} />);
    } else if (syncEntry.action === EteSync.SyncEntryAction.Change) {
      icon = (<IconEdit style={{ color: "#FEB115" }} />);
    } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
      icon = (<IconDelete style={{ color: "#F20C0C" }} />);
    }

    let name;
    let uid;
    if (comp.name === "vcalendar") {
      if (EventType.isEvent(comp)) {
        const vevent = EventType.fromVCalendar(comp);
        name = vevent.summary;
        uid = vevent.uid;
      } else {
        const vtodo = TaskType.fromVCalendar(comp);
        name = vtodo.summary;
        uid = vtodo.uid;
      }
    } else if (comp.name === "vcard") {
      const vcard = new ContactType(comp);
      name = vcard.fn;
      uid = vcard.uid;
    } else {
      name = "Error processing entry";
      uid = "";
    }

    // eslint-disable-next-line react/prop-types
    if (props.uid && (props.uid !== uid)) {
      return undefined;
    }

    return (
      <ListItem
        key={key}
        style={style}
        leftIcon={icon}
        primaryText={name}
        secondaryText={uid}
        onClick={() => setDialog(syncEntry)}
      />
    );
  };

  return (
    <div>
      <RollbackToHereDialog
        journal={props.journal}
        entries={props.entries}
        entryUid={rollbackDialogId!}
        open={!!rollbackDialogId}
        onClose={() => setRollbackDialogId(undefined)}
      />
      <Dialog
        open={dialog !== undefined}
        onClose={() => setDialog(undefined)}
      >
        <DialogTitle>
          Raw Content
        </DialogTitle>
        <DialogContent>
          <div>Entry UID: <pre className="d-inline-block">{dialog?.uid}</pre></div>
          <div>Content:
            <pre>{dialog?.content}</pre>
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            onClick={() => {
              setDialog(undefined);
              setRollbackDialogId(dialog?.uid);
            }}
          >
            Recover items until here
          </Button>
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
              rowCount={props.entries.size}
              rowHeight={56}
              rowRenderer={rowRenderer}
            />
          )}
        </AutoSizer>
      </List>
    </div>
  );
}
