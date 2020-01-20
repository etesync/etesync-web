import * as React from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import Dropzone from 'react-dropzone';

import LoadingIndicator from '../widgets/LoadingIndicator';

import { SyncInfoJournal } from '../SyncGate';

import { store, CredentialsData, UserInfoData } from '../store';
import { addEntries } from '../store/actions';
import { createJournalEntry } from '../etesync-helpers';
import * as EteSync from 'etesync';

import * as uuid from 'uuid';
import * as ICAL from 'ical.js';
import { ContactType, EventType, TaskType, PimType } from '../pim-types';

interface PropsType {
  etesync: CredentialsData;
  userInfo: UserInfoData;
  syncJournal: SyncInfoJournal;
  open: boolean;
  onClose?: () => void;
}

class ImportDialog extends React.Component<PropsType> {
  public state = {
    loading: false,
  };

  constructor(props: PropsType) {
    super(props);

    this.onFileDropCommon = this.onFileDropCommon.bind(this);
    this.onFileDropEvent = this.onFileDropEvent.bind(this);
    this.onFileDropTask = this.onFileDropTask.bind(this);
    this.onFileDropContact = this.onFileDropContact.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  public render() {
    const { syncJournal } = this.props;
    const { loading } = this.state;
    const collectionInfo = syncJournal.collection;
    let acceptTypes;
    let dropFunction;

    if (collectionInfo.type === 'ADDRESS_BOOK') {
      acceptTypes = ['text/vcard'];
      dropFunction = this.onFileDropContact;
    } else if (collectionInfo.type === 'CALENDAR') {
      acceptTypes = ['text/calendar'];
      dropFunction = this.onFileDropEvent;
    } else if (collectionInfo.type === 'TASKS') {
      acceptTypes = ['text/calendar'];
      dropFunction = this.onFileDropTask;
    }

    return (
      <React.Fragment>
        <Dialog
          open={this.props.open}
          onClose={this.onClose}
        >
          <DialogTitle>Import entries from file?</DialogTitle>
          <DialogContent>
            {loading ?
              <LoadingIndicator style={{ display: 'block', margin: 'auto' }} />
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
            <Button disabled={loading} onClick={this.onClose} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    );
  }

  private onFileDropCommon(itemsCreator: (fileText: string) => PimType[], acceptedFiles: File[], rejectedFiles: File[]) {
    // XXX: implement handling of rejectedFiles
    const reader = new FileReader();

    reader.onabort = () => {
      this.setState({ loading: false });
      console.error('Import Aborted');
      alert('file reading was aborted');
    };
    reader.onerror = (e) => {
      this.setState({ loading: false });
      console.error(e);
      alert('file reading has failed');
    };
    reader.onload = () => {
      try {
        const fileText = reader.result as string;
        const items = itemsCreator(fileText);

        const { syncJournal } = this.props;
        const last = syncJournal.journalEntries.last() as EteSync.Entry;
        const lastUid = last ? last.uid : null;

        // XXX implement chunked push most likely...
        let prevUid = lastUid;
        const journalItems = items.map((item) => {
          const ret = createJournalEntry(
            this.props.etesync, this.props.userInfo, syncJournal.journal,
            prevUid, EteSync.SyncEntryAction.Add, item.toIcal());

          prevUid = ret.uid;
          return ret;
        });

        store.dispatch<any>(
          addEntries(this.props.etesync, syncJournal.journal.uid, journalItems, lastUid)
        ).then(() => {
          if (this.props.onClose) {
            this.setState({ loading: false });
            this.props.onClose();
          }
        });
      } catch (e) {
        console.error(e);
        alert('An error has occurred, please contact developers.');
        if (this.props.onClose) {
          this.setState({ loading: false });
          this.props.onClose();
        }
        throw e;
      }
    };

    if (acceptedFiles.length > 0) {
      this.setState({ loading: true });
      acceptedFiles.forEach((file) => {
        reader.readAsText(file);
      });
    } else {
      alert('Failed importing file. Is the file type supported?');
      console.log('Failed importing files. Rejected:', rejectedFiles);
    }
  }

  private onFileDropContact(acceptedFiles: File[], rejectedFiles: File[]) {
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

    this.onFileDropCommon(itemsCreator, acceptedFiles, rejectedFiles);
  }

  private onFileDropEvent(acceptedFiles: File[], rejectedFiles: File[]) {
    const itemsCreator = (fileText: string) => {
      const calendarComp = new ICAL.Component(ICAL.parse(fileText));
      return calendarComp.getAllSubcomponents('vevent').map((comp) => {
        const ret = new EventType(comp);
        if (!ret.uid) {
          ret.uid = uuid.v4();
        }
        return ret;
      });
    };

    this.onFileDropCommon(itemsCreator, acceptedFiles, rejectedFiles);
  }

  private onFileDropTask(acceptedFiles: File[], rejectedFiles: File[]) {
    const itemsCreator = (fileText: string) => {
      const calendarComp = new ICAL.Component(ICAL.parse(fileText));
      return calendarComp.getAllSubcomponents('vtodo').map((comp) => {
        const ret = new TaskType(comp);
        if (!ret.uid) {
          ret.uid = uuid.v4();
        }
        return ret;
      });
    };

    this.onFileDropCommon(itemsCreator, acceptedFiles, rejectedFiles);
  }

  private onClose() {
    if (this.state.loading) {
      return;
    }

    if (this.props.onClose) {
      this.props.onClose();
    }
  }
}

export default ImportDialog;

