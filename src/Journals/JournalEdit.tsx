import * as React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import { Theme, withTheme } from '@material-ui/core/styles';
import IconDelete from '@material-ui/icons/Delete';
import IconCancel from '@material-ui/icons/Clear';
import IconSave from '@material-ui/icons/Save';
import * as colors from '@material-ui/core/colors';

import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';
import ConfirmationDialog from '../widgets/ConfirmationDialog';

import * as EteSync from '../api/EteSync';
import { SyncInfo } from '../SyncGate';
import { handleInputChange } from '../helpers';

interface PropsType {
  syncInfo: SyncInfo;
  item?: EteSync.CollectionInfo;
  onSave: (info: EteSync.CollectionInfo, originalInfo?: EteSync.CollectionInfo) => void;
  onDelete: (info: EteSync.CollectionInfo) => void;
  onCancel: () => void;
}

interface PropsTypeInner extends PropsType {
  theme: Theme;
}

class JournalEdit extends React.PureComponent<PropsTypeInner> {
  state = {
    info: {
      uid: '',
      type: '',
      displayName: '',
      description: '',
    } as EteSync.CollectionInfo,

    showDeleteDialog: false,
  };

  private handleInputChange: any;

  constructor(props: PropsTypeInner) {
    super(props);
    this.handleInputChange = handleInputChange(this, 'info');
    this.onSubmit = this.onSubmit.bind(this);
    this.onDeleteRequest = this.onDeleteRequest.bind(this);

    if (this.props.item !== undefined) {
      const collection = this.props.item;

      this.state.info = {...collection};
    } else {
      this.state.info.uid = EteSync.genUid();
      this.state.info.type = 'ADDRESS_BOOK';
    }
  }

  render() {
    const { item, onDelete, onCancel } = this.props;

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
        <Container style={{maxWidth: 400}}>
          <form onSubmit={this.onSubmit}>
            <FormControl disabled={this.props.item !== undefined} style={styles.fullWidth} >
              <InputLabel>
                Collection type
              </InputLabel>
              <Select
                name="type"
                required={true}
                value={this.state.info.type}
                onChange={this.handleInputChange}
              >
                {Object.keys(journalTypes).map((x) => (
                  <MenuItem key={x} value={x}>{journalTypes[x]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="displayName"
              required={true}
              label="Display name of this collection"
              value={this.state.info.displayName}
              onChange={this.handleInputChange}
              style={styles.fullWidth}
              margin="normal"
            />
            <TextField
              name="description"
              label="Description (optional)"
              value={this.state.info.description}
              onChange={this.handleInputChange}
              style={styles.fullWidth}
              margin="normal"
            />

            <div style={styles.submit}>
              <Button
                variant="raised"
                onClick={onCancel}
              >
               <IconCancel style={{marginRight: 8}} />
                Cancel
              </Button>

              {this.props.item &&
                <Button
                  variant="raised"
                  style={{marginLeft: 15, backgroundColor: colors.red[500], color: 'white'}}
                  onClick={this.onDeleteRequest}
                >
                  <IconDelete style={{marginRight: 8}} />
                  Delete
                </Button>
              }

              <Button
                type="submit"
                variant="raised"
                color="secondary"
                style={{marginLeft: 15}}
              >
                <IconSave style={{marginRight: 8}} />
                Save
              </Button>
            </div>
          </form>
        </Container>
        <ConfirmationDialog
          title="Delete Confirmation"
          labelOk="Delete"
          open={this.state.showDeleteDialog}
          onOk={() => onDelete(this.props.item!)}
          onCancel={() => this.setState({showDeleteDialog: false})}
        >
          Are you sure you would like to delete this journal?
        </ConfirmationDialog>
      </>
    );
  }

  private onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    const { onSave } = this.props;
    const item = new EteSync.CollectionInfo(this.state.info);

    onSave(item, this.props.item);
  }

  private onDeleteRequest() {
    this.setState({
      showDeleteDialog: true
    });
  }

}

export default withTheme()(JournalEdit);
