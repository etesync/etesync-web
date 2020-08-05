// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import Dropzone from "react-dropzone";

import LoadingIndicator from "../widgets/LoadingIndicator";

import { SyncInfoJournal } from "../SyncGate";

import { store, CredentialsData, UserInfoData } from "../store";
import { addEntries } from "../store/actions";
import { createJournalEntry } from "../etesync-helpers";
import * as EteSync from "etesync";

import * as uuid from "uuid";
import * as ICAL from "ical.js";
import { ContactType, EventType, TaskType, PimType } from "../pim-types";

interface PropsType {
  etesync: CredentialsData;
  userInfo: UserInfoData;
  syncJournal: SyncInfoJournal;
  open: boolean;
  onClose?: () => void;
}

export default function ImportDialog(props: PropsType) {
  const [loading, setLoading] = React.useState(false);

  function onFileDropCommon(itemsCreator: (fileText: string) => PimType[], acceptedFiles: File[], rejectedFiles: File[]) {
    // XXX: implement handling of rejectedFiles
    const reader = new FileReader();

    reader.onabort = () => {
      setLoading(false);
      console.error("Import Aborted");
      alert("file reading was aborted");
    };
    reader.onerror = (e) => {
      setLoading(false);
      console.error(e);
      alert("file reading has failed");
    };
    reader.onload = async () => {
      try {
        const fileText = reader.result as string;
        const items = itemsCreator(fileText);

        const { syncJournal } = props;
        const last = syncJournal.journalEntries.last() as EteSync.Entry;
        const lastUid = last ? last.uid : null;

        // XXX implement chunked push most likely...
        let prevUid = lastUid;
        const journalItems = items.map((item) => {
          const ret = createJournalEntry(
            props.etesync, props.userInfo, syncJournal.journal,
            prevUid, EteSync.SyncEntryAction.Add, item.toIcal());

          prevUid = ret.uid;
          return ret;
        });

        await store.dispatch<any>(
          addEntries(props.etesync, syncJournal.journal.uid, journalItems, lastUid)
        );
      } catch (e) {
        console.error(e);
        alert("An error has occurred, please contact developers.");
        throw e;
      } finally {
        if (props.onClose) {
          setLoading(false);
          props.onClose();
        }
      }
    };

    if (acceptedFiles.length > 0) {
      setLoading(true);
      acceptedFiles.forEach((file) => {
        reader.readAsText(file);
      });
    } else {
      alert("Failed importing file. Is the file type supported?");
      console.log("Failed importing files. Rejected:", rejectedFiles);
    }
  }

  function onFileDropContact(acceptedFiles: File[], rejectedFiles: File[]) {
    const itemsCreator = (fileText: string) => {
      const mainComp = ICAL.parse(fileText);
      return mainComp.map((comp) => {
        const ret = new ContactType(new ICAL.Component(comp));
        if (!ret.uid) {
          ret.uid = uuid.v4();
        }
        return ret;
      });
    };

    onFileDropCommon(itemsCreator, acceptedFiles, rejectedFiles);
  }

  function onFileDropEvent(acceptedFiles: File[], rejectedFiles: File[]) {
    const itemsCreator = (fileText: string) => {
      const calendarComp = new ICAL.Component(ICAL.parse(fileText));
      return calendarComp.getAllSubcomponents("vevent").map((comp) => {
        const ret = new EventType(comp);
        if (!ret.uid) {
          ret.uid = uuid.v4();
        }
        return ret;
      });
    };

    onFileDropCommon(itemsCreator, acceptedFiles, rejectedFiles);
  }

  function onFileDropTask(acceptedFiles: File[], rejectedFiles: File[]) {
    const itemsCreator = (fileText: string) => {
      const calendarComp = new ICAL.Component(ICAL.parse(fileText));
      return calendarComp.getAllSubcomponents("vtodo").map((comp) => {
        const ret = new TaskType(comp);
        if (!ret.uid) {
          ret.uid = uuid.v4();
        }
        return ret;
      });
    };

    onFileDropCommon(itemsCreator, acceptedFiles, rejectedFiles);
  }

  function onClose() {
    if (loading) {
      return;
    }

    if (props.onClose) {
      props.onClose();
    }
  }

  const { syncJournal } = props;
  const collectionInfo = syncJournal.collection;
  let acceptTypes;
  let dropFunction;

  if (collectionInfo.type === "ADDRESS_BOOK") {
    acceptTypes = ["text/vcard", "text/directory", "text/x-vcard", ".vcf"];
    dropFunction = onFileDropContact;
  } else if (collectionInfo.type === "CALENDAR") {
    acceptTypes = ["text/calendar", ".ics", ".ical"];
    dropFunction = onFileDropEvent;
  } else if (collectionInfo.type === "TASKS") {
    acceptTypes = ["text/calendar", ".ics", ".ical"];
    dropFunction = onFileDropTask;
  }

  return (
    <React.Fragment>
      <Dialog
        open={props.open}
        onClose={onClose}
      >
        <DialogTitle>Import entries from file?</DialogTitle>
        <DialogContent>
          {loading ?
            <LoadingIndicator style={{ display: "block", margin: "auto" }} />
            :
            <Dropzone
              onDrop={dropFunction}
              multiple={false}
              accept={acceptTypes}
            >
              {({ getRootProps, getInputProps }) => (
                <section>
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <DialogContentText id="alert-dialog-description">
                      To import entries from a file, drag 'n' drop it here, or click to open the file selector.
                    </DialogContentText>
                  </div>
                </section>
              )}
            </Dropzone>
          }
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={onClose} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
