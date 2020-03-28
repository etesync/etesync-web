// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import * as colors from '@material-ui/core/colors';
import FormLabel from '@material-ui/core/FormLabel';
import RadioGroup from '@material-ui/core/RadioGroup';

import Autocomplete from '@material-ui/lab/Autocomplete';

import IconDelete from '@material-ui/icons/Delete';
import IconCancel from '@material-ui/icons/Clear';
import IconSave from '@material-ui/icons/Save';

import DateTimePicker from '../../widgets/DateTimePicker';

import ConfirmationDialog from '../../widgets/ConfirmationDialog';
import TimezonePicker from '../../widgets/TimezonePicker';

import { Location } from 'history';
import { withRouter } from 'react-router';

import * as uuid from 'uuid';
import * as ICAL from 'ical.js';

import * as EteSync from 'etesync';

import { getCurrentTimezone, mapPriority } from '../../helpers';

import { TaskType, TaskStatusType, timezoneLoadFromName, TaskPriorityType, TaskTags } from '../../pim-types';

import { History } from 'history';

import ColoredRadio from '../../widgets/ColoredRadio';

interface PropsType {
  collections: EteSync.CollectionInfo[];
  initialCollection?: string;
  item?: TaskType;
  onSave: (item: TaskType, journalUid: string, originalItem?: TaskType) => Promise<void>;
  onDelete: (item: TaskType, journalUid: string) => void;
  onCancel: () => void;
  location: Location;
  history: History<any>;
}

class TaskEdit extends React.PureComponent<PropsType> {
  public state: {
    uid: string;
    title: string;
    status: TaskStatusType;
    priority: TaskPriorityType;
    includeTime: boolean;
    start?: Date;
    due?: Date;
    timezone: string | null;
    location: string;
    description: string;
    tags: string[];
    journalUid: string;

    error?: string;
    showDeleteDialog: boolean;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      uid: '',
      title: '',
      status: TaskStatusType.NeedsAction,
      priority: TaskPriorityType.Undefined,
      includeTime: false,
      location: '',
      description: '',
      tags: [],
      timezone: null,

      journalUid: '',
      showDeleteDialog: false,
    };

    if (this.props.item !== undefined) {
      const task = this.props.item;

      this.state.uid = task.uid;
      this.state.title = task.title ? task.title : '';
      this.state.status = task.status ?? TaskStatusType.NeedsAction;
      this.state.priority = task.priority ?? TaskPriorityType.Undefined;
      if (task.startDate) {
        this.state.includeTime = !task.startDate.isDate;
        this.state.start = task.startDate.convertToZone(ICAL.Timezone.localTimezone).toJSDate();
      }
      if (task.dueDate) {
        this.state.due = task.dueDate.convertToZone(ICAL.Timezone.localTimezone).toJSDate();
      }
      this.state.location = task.location ? task.location : '';
      this.state.description = task.description ? task.description : '';
      this.state.timezone = task.timezone;
      this.state.tags = task.tags;
    } else {
      this.state.uid = uuid.v4();
    }

    this.state.timezone = this.state.timezone || getCurrentTimezone();

    if (props.initialCollection) {
      this.state.journalUid = props.initialCollection;
    } else if (props.collections[0]) {
      this.state.journalUid = props.collections[0].uid;
    }

    this.onSubmit = this.onSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.toggleTime = this.toggleTime.bind(this);
    this.onDeleteRequest = this.onDeleteRequest.bind(this);
  }

  public UNSAFE_componentWillReceiveProps(nextProps: any) {
    if ((this.props.collections !== nextProps.collections) ||
      (this.props.initialCollection !== nextProps.initialCollection)) {
      if (nextProps.initialCollection) {
        this.setState({
          journalUid: nextProps.initialCollection,
        });
      } else if (nextProps.collections[0]) {
        this.setState({
          journalUid: nextProps.collections[0].uid,
        });
      }
    }
  }

  public handleChange(name: string, value: string | number | string[]) {
    this.setState({
      [name]: value,
    });

  }

  public handleInputChange(event: React.ChangeEvent<any>) {
    const name = event.target.name;
    const value = event.target.value;
    this.handleChange(name, value);
  }

  public toggleTime() {
    this.setState({ includeTime: !this.state.includeTime });
  }

  public onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    function fromDate(date: Date | undefined, includeTime: boolean) {
      if (!date) {
        return undefined;
      }
      const ret = ICAL.Time.fromJSDate(date, false);
      if (includeTime) {
        return ret;
      } else {
        const data = ret.toJSON();
        data.isDate = true;
        return ICAL.Time.fromData(data);
      }
    }

    const startDate = fromDate(this.state.start, this.state.includeTime);
    const dueDate = fromDate(this.state.due, this.state.includeTime);

    if (startDate && dueDate) {
      if (startDate.compare(dueDate) >= 0) {
        this.setState({ error: 'End time must be later than start time!' });
        return;
      }
    }

    const task = (this.props.item) ?
      this.props.item.clone()
      :
      new TaskType(null)
      ;

    task.uid = this.state.uid;
    task.summary = this.state.title;
    task.status = this.state.status;
    task.priority = this.state.priority;
    task.tags = this.state.tags;
    if (startDate) {
      task.startDate = startDate;
    }
    task.dueDate = dueDate;
    task.location = this.state.location;
    task.description = this.state.description;
    if (this.state.timezone) {
      const timezone = timezoneLoadFromName(this.state.timezone);
      if (timezone) {
        if (task.startDate) {
          task.startDate = task.startDate.convertToZone(timezone);
        }
        if (task.dueDate) {
          task.dueDate = task.dueDate.convertToZone(timezone);
        }
        if (task.completionDate) {
          task.completionDate = task.completionDate.convertToZone(timezone);
        }
      }
    }

    task.component.updatePropertyWithValue('last-modified', ICAL.Time.now());

    this.props.onSave(task, this.state.journalUid, this.props.item)
      .then(() => {
        this.props.history.goBack();
      });
  }

  public onDeleteRequest() {
    this.setState({
      showDeleteDialog: true,
    });
  }

  public render() {
    const styles = {
      form: {
      },
      fullWidth: {
        width: '100%',
        boxSizing: 'border-box' as any,
        marginTop: 16,
      },
      submit: {
        marginTop: 40,
        marginBottom: 20,
        textAlign: 'right' as any,
      },
    };

    const recurring = this.props.item && this.props.item.isRecurring();
    const differentTimezone = this.state.timezone && (this.state.timezone !== getCurrentTimezone()) && timezoneLoadFromName(this.state.timezone);

    return (
      <React.Fragment>
        <h2>
          {this.props.item ? 'Edit Task' : 'New Task'}
        </h2>
        {recurring && (
          <div>
            <span style={{ color: 'red' }}>IMPORTANT: </span>
            This is a recurring task, for now, only editing the whole series
            (by editing the first instance) is supported.
          </div>
        )}
        {this.state.error && (
          <div>ERROR! {this.state.error}</div>
        )}
        <form style={styles.form} onSubmit={this.onSubmit}>
          <TextField
            name="title"
            placeholder="Enter title"
            style={styles.fullWidth}
            value={this.state.title}
            onChange={this.handleInputChange}
          />

          <FormControl disabled={this.props.item !== undefined} style={styles.fullWidth}>
            <InputLabel>
              Saving to
            </InputLabel>
            <Select
              name="journalUid"
              value={this.state.journalUid}
              disabled={this.props.item !== undefined}
              onChange={this.handleInputChange}
            >
              {this.props.collections.map((x) => (
                <MenuItem key={x.uid} value={x.uid}>{x.displayName}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl style={styles.fullWidth}>
            <InputLabel>
              Status
            </InputLabel>
            <Select
              name="status"
              value={this.state.status}
              onChange={this.handleInputChange}
            >
              <MenuItem value={TaskStatusType.NeedsAction}>Needs action</MenuItem>
              <MenuItem value={TaskStatusType.InProcess}>In progress</MenuItem>
              <MenuItem value={TaskStatusType.Completed}>Completed</MenuItem>
              <MenuItem value={TaskStatusType.Cancelled}>Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl style={styles.fullWidth}>
            <FormLabel>Priority</FormLabel>

            <RadioGroup
              row
              value={mapPriority(this.state.priority)}
              onChange={(e) => this.handleChange('priority', Number(e.target.value))}
            >
              <ColoredRadio value={TaskPriorityType.Undefined} label="None" color={colors.grey[600]} />
              <ColoredRadio value={TaskPriorityType.Low} label="Low" color={colors.blue[600]} />
              <ColoredRadio value={TaskPriorityType.Medium} label="Medium" color={colors.orange[600]} />
              <ColoredRadio value={TaskPriorityType.High} label="High" color={colors.red[600]} />
            </RadioGroup>
          </FormControl>

          <FormControl style={styles.fullWidth}>
            <FormHelperText>Hide until</FormHelperText>
            <DateTimePicker
              dateOnly={!this.state.includeTime}
              placeholder="Hide until"
              value={this.state.start}
              onChange={(date?: Date) => this.setState({ start: date })}
            />
            {differentTimezone && this.state.start && (
              <FormHelperText>{ICAL.Time.fromJSDate(this.state.start, false).convertToZone(differentTimezone!).toJSDate().toString()}</FormHelperText>
            )}
          </FormControl>

          <FormControl style={styles.fullWidth}>
            <FormHelperText>Due</FormHelperText>
            <DateTimePicker
              dateOnly={!this.state.includeTime}
              placeholder="Due"
              value={this.state.due}
              onChange={(date?: Date) => this.setState({ due: date })}
            />
            {differentTimezone && this.state.due && (
              <FormHelperText>{ICAL.Time.fromJSDate(this.state.due, false).convertToZone(differentTimezone!).toJSDate().toString()}</FormHelperText>
            )}
          </FormControl>

          <FormGroup style={styles.fullWidth}>
            <FormControlLabel
              control={
                <Switch
                  name="includeTime"
                  checked={this.state.includeTime}
                  onChange={this.toggleTime}
                  color="primary"
                />
              }
              label="Include time"
            />
          </FormGroup>

          {(this.state.includeTime) && (
            <TimezonePicker style={styles.fullWidth} value={this.state.timezone} onChange={(zone) => this.setState({ timezone: zone })} />
          )}

          <TextField
            name="location"
            placeholder="Add location"
            style={styles.fullWidth}
            value={this.state.location}
            onChange={this.handleInputChange}
          />

          <TextField
            name="description"
            placeholder="Add description"
            multiline
            style={styles.fullWidth}
            value={this.state.description}
            onChange={this.handleInputChange}
          />

          <Autocomplete
            style={styles.fullWidth}
            multiple
            options={TaskTags}
            value={this.state.tags}
            onChange={(_e, value) => this.handleChange('tags', value)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                label="Tags"
                fullWidth
              />
            )}
          />

          <div style={styles.submit}>
            <Button
              variant="contained"
              onClick={this.props.onCancel}
            >
              <IconCancel style={{ marginRight: 8 }} />
              Cancel
            </Button>

            {this.props.item &&
              <Button
                variant="contained"
                style={{ marginLeft: 15, backgroundColor: colors.red[500], color: 'white' }}
                onClick={this.onDeleteRequest}
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

          <div>
            Not all types are supported at the moment. If you are editing a contact,
            the unsupported types will be copied as is.
          </div>
        </form>

        <ConfirmationDialog
          title="Delete Confirmation"
          labelOk="Delete"
          open={this.state.showDeleteDialog}
          onOk={() => this.props.onDelete(this.props.item!, this.props.initialCollection!)}
          onCancel={() => this.setState({ showDeleteDialog: false })}
        >
          Are you sure you would like to delete this task?
        </ConfirmationDialog>
      </React.Fragment>
    );
  }
}

export default withRouter(TaskEdit);
