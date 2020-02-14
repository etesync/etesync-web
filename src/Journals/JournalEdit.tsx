import * as React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import IconDelete from '@material-ui/icons/Delete';
import IconCancel from '@material-ui/icons/Clear';
import IconSave from '@material-ui/icons/Save';
import * as colors from '@material-ui/core/colors';

import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';
import ConfirmationDialog from '../widgets/ConfirmationDialog';

import * as EteSync from 'etesync';
import { SyncInfo } from '../SyncGate';

interface PropsType {
  syncInfo: SyncInfo;
  item?: EteSync.CollectionInfo;
  onSave: (info: EteSync.CollectionInfo, originalInfo?: EteSync.CollectionInfo) => void;
  onDelete: (info: EteSync.CollectionInfo) => void;
  onCancel: () => void;
}

export default function JournalEdit(props: PropsType) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [info, setInfo] = React.useState<EteSync.CollectionInfo>();

  React.useEffect(() => {
    if (props.item !== undefined) {
      setInfo(props.item);
    } else {
      setInfo({
        uid: EteSync.genUid(),
        type: 'ADDRESS_BOOK',
        displayName: '',
        description: '',
      } as EteSync.CollectionInfo);
    }
  }, [props.item]);

  if (info === undefined) {
    return <React.Fragment />;
  }

  function onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    const { onSave } = props;
    const item = new EteSync.CollectionInfo(info);

    onSave(item, props.item);
  }

  function onDeleteRequest() {
    setShowDeleteDialog(true);
  }

  const { item, onDelete, onCancel } = props;

  const pageTitle = (item !== undefined) ? item.displayName : 'New Journal';

  const styles = {
    fullWidth: {
      width: '100%',
    },
    submit: {
      marginTop: 40,
      marginBottom: 20,
      textAlign: 'right' as any,
    },
  };

  const journalTypes = {
    ADDRESS_BOOK: 'Address Book',
    CALENDAR: 'Calendar',
    TASKS: 'Task List',
  };

  return (
    <>
      <AppBarOverride title={pageTitle} />
      <Container style={{ maxWidth: '30rem' }}>
        <form onSubmit={onSubmit}>
          <FormControl disabled={props.item !== undefined} style={styles.fullWidth}>
            <InputLabel>
              Collection type
            </InputLabel>
            <Select
              name="type"
              required
              value={info.type}
              onChange={(event: React.ChangeEvent<{ value: string }>) => setInfo({ ...info, type: event.target.value })}
            >
              {Object.keys(journalTypes).map((x) => (
                <MenuItem key={x} value={x}>{journalTypes[x]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="displayName"
            required
            label="Display name of this collection"
            value={info.displayName}
            onChange={(event: React.ChangeEvent<{ value: string }>) => setInfo({ ...info, displayName: event.target.value })}
            style={styles.fullWidth}
            margin="normal"
          />
          <TextField
            name="description"
            label="Description (optional)"
            value={info.description}
            onChange={(event: React.ChangeEvent<{ value: string }>) => setInfo({ ...info, description: event.target.value })}
            style={styles.fullWidth}
            margin="normal"
          />

          <div style={styles.submit}>
            <Button
              variant="contained"
              onClick={onCancel}
            >
              <IconCancel style={{ marginRight: 8 }} />
              Cancel
            </Button>

            {props.item &&
              <Button
                variant="contained"
                style={{ marginLeft: 15, backgroundColor: colors.red[500], color: 'white' }}
                onClick={onDeleteRequest}
              >
                <IconDelete style={{ marginRight: 8 }} />
                Delete
              </Button>
            }

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              style={{ marginLeft: 15 }}
            >
              <IconSave style={{ marginRight: 8 }} />
              Save
            </Button>
          </div>
        </form>
      </Container>
      <ConfirmationDialog
        title="Delete Confirmation"
        labelOk="Delete"
        open={showDeleteDialog}
        onOk={() => onDelete(props.item!)}
        onCancel={() => setShowDeleteDialog(false)}
      >
        Are you sure you would like to delete this journal?
      </ConfirmationDialog>
    </>
  );
}
