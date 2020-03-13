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

import { TaskType, TaskStatusType, timezoneLoadFromName, TaskPriorityType } from '../../pim-types';

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
    allDay: boolean;
    start?: Date;
    due?: Date;
    timezone: string | null;
    location: string;
    description: string;
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
      allDay: false,
      location: '',
      description: '',
      timezone: null,

      journalUid: '',
      showDeleteDialog: false,
    };

    if (this.props.item !== undefined) {
      const event = this.props.item;

      this.state.uid = event.uid;
      this.state.title = event.title ? event.title : '';
      this.state.status = event.status;
      this.state.priority = event.priority || TaskPriorityType.Undefined;
      if (event.startDate) {
        this.state.allDay = event.startDate.isDate;
        this.state.start = event.startDate.convertToZone(ICAL.Timezone.localTimezone).toJSDate();
      }
      if (event.dueDate) {
        this.state.due = event.dueDate.convertToZone(ICAL.Timezone.localTimezone).toJSDate();
      }
      this.state.location = event.location ? event.location : '';
      this.state.description = event.description ? event.description : '';
      this.state.timezone = event.timezone;
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
    this.toggleAllDay = this.toggleAllDay.bind(this);
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

  public handleChange(name: string, value: string | number) {
    this.setState({
      [name]: value,
    });

  }

  public handleInputChange(event: React.ChangeEvent<any>) {
    const name = event.target.name;
    const value = event.target.value;
    this.handleChange(name, value);
  }

  public toggleAllDay() {
    this.setState({ allDay: !this.state.allDay });
  }

  public onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    function fromDate(date: Date | undefined, allDay: boolean) {
      if (!date) {
        return undefined;
      }
      const ret = ICAL.Time.fromJSDate(date, false);
      if (!allDay) {
        return ret;
      } else {
        const data = ret.toJSON();
        data.isDate = allDay;
        return ICAL.Time.fromData(data);
      }
    }

    const startDate = fromDate(this.state.start, this.state.allDay);
    const dueDate = fromDate(this.state.due, this.state.allDay);

    if (startDate && dueDate) {
      if (startDate.compare(dueDate) >= 0) {
        this.setState({ error: 'End time must be later than start time!' });
        return;
      }
    }

    const event = (this.props.item) ?
      this.props.item.clone()
      :
      new TaskType(null)
      ;

    event.uid = this.state.uid;
    event.summary = this.state.title;
    event.status = this.state.status;
    event.priority = this.state.priority;
    if (startDate) {
      event.startDate = startDate;
    }
    event.dueDate = dueDate;
    event.location = this.state.location;
    event.description = this.state.description;
    if (this.state.timezone) {
      const timezone = timezoneLoadFromName(this.state.timezone);
      if (timezone) {
        if (event.startDate) {
          event.startDate = event.startDate.convertToZone(timezone);
        }
        if (event.dueDate) {
          event.dueDate = event.dueDate.convertToZone(timezone);
        }
        if (event.completionDate) {
          event.completionDate = event.completionDate.convertToZone(timezone);
        }
      }
    }

    event.component.updatePropertyWithValue('last-modified', ICAL.Time.now());

    this.props.onSave(event, this.state.journalUid, this.props.item)
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
            This is a recurring event, for now, only editing the whole series
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

          <FormControl>
            <FormHelperText>Start</FormHelperText>
            <DateTimePicker
              dateOnly={this.state.allDay}
              placeholder="Start"
              value={this.state.start}
              onChange={(date?: Date) => this.setState({ start: date })}
            />
            {differentTimezone && this.state.start && (
              <FormHelperText>{ICAL.Time.fromJSDate(this.state.start, false).convertToZone(differentTimezone!).toJSDate().toString()}</FormHelperText>
            )}
          </FormControl>

          <FormControl>
            <FormHelperText>Due</FormHelperText>
            <DateTimePicker
              dateOnly={this.state.allDay}
              placeholder="Due"
              value={this.state.due}
              onChange={(date?: Date) => this.setState({ due: date })}
            />
            {differentTimezone && this.state.due && (
              <FormHelperText>{ICAL.Time.fromJSDate(this.state.due, false).convertToZone(differentTimezone!).toJSDate().toString()}</FormHelperText>
            )}
          </FormControl>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  name="allDay"
                  checked={this.state.allDay}
                  onChange={this.toggleAllDay}
                  color="primary"
                />
              }
              label="All Day"
            />
          </FormGroup>

          {(!this.state.allDay) && (
            <TimezonePicker value={this.state.timezone} onChange={(zone) => this.setState({ timezone: zone })} />
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
          Are you sure you would like to delete this event?
        </ConfirmationDialog>
      </React.Fragment>
    );
  }
}

export default withRouter(TaskEdit);
