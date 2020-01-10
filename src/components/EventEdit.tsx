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

import IconDelete from '@material-ui/icons/Delete';
import IconCancel from '@material-ui/icons/Clear';
import IconSave from '@material-ui/icons/Save';

import DateTimePicker from '../widgets/DateTimePicker';

import ConfirmationDialog from '../widgets/ConfirmationDialog';
import TimezonePicker from '../widgets/TimezonePicker';

import { Location } from 'history';
import { withRouter } from 'react-router';

import * as uuid from 'uuid';
import * as ICAL from 'ical.js';

import * as EteSync from 'etesync';

import { getCurrentTimezone } from '../helpers';

import { EventType, timezoneLoadFromName } from '../pim-types';

interface PropsType {
  collections: EteSync.CollectionInfo[];
  initialCollection?: string;
  item?: EventType;
  onSave: (event: EventType, journalUid: string, originalEvent?: EventType) => void;
  onDelete: (event: EventType, journalUid: string) => void;
  onCancel: () => void;
  location: Location;
}

class EventEdit extends React.PureComponent<PropsType> {
  public state: {
    uid: string;
    title: string;
    allDay: boolean;
    start?: Date;
    end?: Date;
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
      allDay: false,
      location: '',
      description: '',
      timezone: null,

      journalUid: '',
      showDeleteDialog: false,
    };

    const locState = this.props.location.state;
    if (locState) {
      // FIXME: Hack to determine if all day. Should be passed as a proper state.
      this.state.allDay = (locState.start &&
        (locState.start.getHours() === 0) &&
        (locState.start.getMinutes() === 0) &&
        (locState.start.getHours() === locState.end.getHours()) &&
        (locState.start.getMinutes() === locState.end.getMinutes()));
      this.state.start = (locState.start) ? locState.start : undefined;
      this.state.end = (locState.end) ? locState.end : undefined;
    }

    if (this.props.item !== undefined) {
      const event = this.props.item;

      const allDay = event.startDate.isDate;
      const endDate = event.endDate.clone();

      if (allDay) {
        endDate.adjust(-1, 0, 0, 0);
      }

      this.state.uid = event.uid;
      this.state.title = event.title ? event.title : '';
      this.state.allDay = allDay;
      this.state.start = event.startDate.convertToZone(ICAL.Timezone.localTimezone).toJSDate();
      this.state.end = endDate.convertToZone(ICAL.Timezone.localTimezone).toJSDate();
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

  public handleChange(name: string, value: string) {
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

    if ((!this.state.start) || (!this.state.end)) {
      this.setState({ error: 'Both start and end time must be set!' });
      return;
    }

    function fromDate(date: Date, allDay: boolean) {
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
    const endDate = fromDate(this.state.end, this.state.allDay);

    if (this.state.allDay) {
      endDate.adjust(1, 0, 0, 0);
    }

    if (startDate.compare(endDate) >= 0) {
      this.setState({ error: 'End time must be later than start time!' });
      return;
    }

    const event = (this.props.item) ?
      this.props.item.clone()
      :
      new EventType()
    ;
    event.uid = this.state.uid;
    event.summary = this.state.title;
    event.startDate = startDate;
    event.endDate = endDate;
    event.location = this.state.location;
    event.description = this.state.description;
    if (this.state.timezone) {
      const timezone = timezoneLoadFromName(this.state.timezone);
      if (timezone) {
        event.startDate = event.startDate?.convertToZone(timezone);
        event.endDate = event.endDate?.convertToZone(timezone);
      }
    }

    event.component.updatePropertyWithValue('last-modified', ICAL.Time.now());

    this.props.onSave(event, this.state.journalUid, this.props.item);
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
      <>
        <h2>
          {this.props.item ? 'Edit Event' : 'New Event'}
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

          <FormControl>
            <FormHelperText>FROM</FormHelperText>
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
            <FormHelperText>TO</FormHelperText>
            <DateTimePicker
              dateOnly={this.state.allDay}
              placeholder="End"
              value={this.state.end}
              onChange={(date?: Date) => this.setState({ end: date })}
            />
            {differentTimezone && this.state.end && (
              <FormHelperText>{ICAL.Time.fromJSDate(this.state.end, false).convertToZone(differentTimezone!).toJSDate().toString()}</FormHelperText>
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
      </>
    );
  }
}

export default withRouter(EventEdit);
