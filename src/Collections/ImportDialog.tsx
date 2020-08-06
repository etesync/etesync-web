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

import { arrayToChunkIterator } from "../helpers";

import * as uuid from "uuid";
import * as ICAL from "ical.js";
import { ContactType, EventType, TaskType, PimType } from "../pim-types";
import { useCredentials } from "../credentials";
import { CachedCollection } from "../Pim/helpers";
import { getCollectionManager } from "../etebase-helpers";

const CHUNK_SIZE = 40;

interface PropsType {
  collection: CachedCollection;
  open: boolean;
  onClose?: () => void;
}

export default function ImportDialog(props: PropsType) {
  const etebase = useCredentials()!;
  const [loading, setLoading] = React.useState(false);
  const [itemsProcessed, setItemsProccessed] = React.useState<number>();

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

        const { collection } = props.collection;
        const colMgr = getCollectionManager(etebase);
        const itemMgr = colMgr.getItemManager(collection);

        const eteItems = [];
        for (const item of items) {
          const mtime = (new Date()).getTime();
          const meta = {
            mtime,
            name: item.uid,
          };
          const content = item.toIcal();

          const eteItem = await itemMgr.create(meta, content);
          eteItems.push(eteItem);
        }

        const chunks = arrayToChunkIterator(eteItems, CHUNK_SIZE);
        for (const chunk of chunks) {
          await itemMgr.batch(chunk);
        }

        setItemsProccessed(items.length);
      } catch (e) {
        console.error(e);
        alert("An error has occurred, please contact developers.");
        throw e;
      } finally {
        if (props.onClose) {
          setLoading(false);
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

  const { metadata } = props.collection;
  let acceptTypes;
  let dropFunction;

  if (metadata.type === "etebase.vcard") {
    acceptTypes = ["text/vcard", "text/directory", "text/x-vcard", ".vcf"];
    dropFunction = onFileDropContact;
  } else if (metadata.type === "etebase.vevent") {
    acceptTypes = ["text/calendar", ".ics", ".ical"];
    dropFunction = onFileDropEvent;
  } else if (metadata.type === "etebase.vtodo") {
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
          {(itemsProcessed !== undefined) ? (
            <p>Imported {itemsProcessed} items.</p>
          ) : (loading ?
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
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
