import React from 'react';

import { Location } from 'history';
import { withRouter } from 'react-router';
import uuid from 'uuid';
import ICAL from 'ical.js';
import EteSync from 'etesync';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import { red } from '@material-ui/core/colors';
import FormLabel from '@material-ui/core/FormLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Autocomplete from '@material-ui/lab/Autocomplete';

import IconDelete from '@material-ui/icons/Delete';
import IconCancel from '@material-ui/icons/Clear';
import IconSave from '@material-ui/icons/Save';

import ColoredRadio from './ColoredRadio';
import DateTimePicker from '../../widgets/DateTimePicker';
import ConfirmationDialog from '../../widgets/ConfirmationDialog';
import { getCurrentTimezone } from '../../helpers';
import { TaskType, TaskStatusType, TaskPriorityType, TaskTags, timezoneLoadFromName } from '../../pim-types';

interface PropsType {
  collections: EteSync.CollectionInfo[];
  initialCollection?: string;
  item?: TaskType;
  onSave: (item: TaskType, journalUid: string, originalItem?: TaskType) => void;
  onDelete: (item: TaskType, journalUid: string) => void;
  onCancel: () => void;
  location: Location;
}

class TaskEdit extends React.PureComponent<PropsType> {
  public state: {
    uid: string;
    title: string;
    status: TaskStatusType;
    allDay: boolean;
    start?: Date;
    due?: Date;
    timezone: string | null;
    location: string;
    description: string;
    journalUid: string;
    tags: string[];
    priority: TaskPriorityType;

    error?: string;
    showDeleteDialog: boolean;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      uid: '',
      title: '',
      status: TaskStatusType.NeedsAction,
      allDay: false,
      location: '',
      description: '',
      timezone: null,
      tags: [],
      priority: TaskPriorityType.None,
      journalUid: '',
      showDeleteDialog: false,
    };

    if (this.props.item !== undefined) {
      const event = this.props.item;

      this.state.uid = event.uid;
      this.state.title = event.title ? event.title : '';
      this.state.status = event.status;
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
      this.state.priority = event.priority ? event.priority : TaskPriorityType.None;

      // checks if event categories is just the empty string
      this.state.tags = event.categories && event.categories[0] ? event.categories : [];
    } else {
      this.state.uid = uuid.v4();
    }

    this.state.timezone = this.state.timezone || getCurrentTimezone();

    if (props.initialCollection) {
      this.state.journalUid = props.initialCollection;
    } else if (props.collections[0]) {
      this.state.journalUid = props.collections[0].uid;
    }
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

  public handleInputChange(event: React.ChangeEvent<any>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({
      [name]: value,
    });
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

    const { start, due, allDay, uid, title, status, priority, location, description, timezone, tags, journalUid } = this.state;

    const startDate = fromDate(start, allDay);
    const dueDate = fromDate(due, allDay);

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

    task.uid = uid;
    task.title = title;
    task.status = status;
    task.priority = priority;
    task.dueDate = dueDate;
    task.location = location;
    task.description = description;
    task.categories = tags;

    if (startDate) {
      task.startDate = startDate;
    }

    if (timezone) {
      const icalTimezone = timezoneLoadFromName(timezone);
      if (icalTimezone) {
        if (task.startDate) {
          task.startDate = task.startDate.convertToZone(icalTimezone);
        }
        if (task.dueDate) {
          task.dueDate = task.dueDate.convertToZone(icalTimezone);
        }
        if (task.completionDate) {
          task.completionDate = task.completionDate.convertToZone(icalTimezone);
        }
      }
    }

    task.lastModified = ICAL.Time.now();

    this.props.onSave(task, journalUid, this.props.item);
  }

  public onDeleteRequest() {
    this.setState({
      showDeleteDialog: true,
    });
  }

  public render() {
    const styles = {
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
        <form onSubmit={(e) => this.onSubmit(e)}>
          <TextField
            name="title"
            label="Title"
            placeholder="Enter title"
            style={styles.fullWidth}
            value={this.state.title}
            onChange={(e) => this.handleInputChange(e)}
          />

          <FormControl disabled={this.props.item !== undefined} style={styles.fullWidth}>
            <InputLabel>
              Saving to
            </InputLabel>
            <Select
              name="journalUid"
              value={this.state.journalUid}
              disabled={this.props.item !== undefined}
              onChange={(e) => this.handleInputChange(e)}
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
              onChange={(e) => this.handleInputChange(e)}
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
              value={this.state.priority}
              onChange={(e) => this.setState({ priority: Number(e.target.value) })}
            >
              <ColoredRadio color="grey" value={TaskPriorityType.None} label="None" />
              <ColoredRadio color="blue" value={TaskPriorityType.Low} label="Low" />
              <ColoredRadio color="orange" value={TaskPriorityType.Med} label="Medium" />
              <ColoredRadio color="red" value={TaskPriorityType.High} label="High" />
            </RadioGroup>
          </FormControl>

          <Autocomplete
            multiple
            options={TaskTags}
            value={this.state.tags}
            onChange={(_e, value) => this.setState({ tags: value })}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                label="Tags"
                placeholder="Start typing tags"
                fullWidth
              />
            )} />

          <FormControl style={styles.fullWidth}>
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
                style={{ marginLeft: 15, backgroundColor: red[500], color: 'white' }}
                onClick={() => this.onDeleteRequest()}
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
