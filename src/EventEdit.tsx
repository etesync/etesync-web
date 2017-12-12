import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Toggle from 'material-ui/Toggle';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import DateTimePicker from './DateTimePicker';

import * as uuid from 'uuid';
import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

import { EventType } from './pim-types';

class EventEdit extends React.Component {
  state: {
    uid: string,
    title: string;
    allDay: boolean;
    start: string;
    end: string;
    location: string;
    description: string;
    journalUid: string;
  };

  props: {
    collections: Array<EteSync.CollectionInfo>,
    initialCollection?: string,
    event?: EventType,
    onSave: (event: EventType, journalUid: string, originalEvent?: EventType) => void;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      uid: '',
      title: '',
      allDay: false,
      location: '',
      description: '',
      journalUid: '',
      start: '',
      end: ''
    };
    if (this.props.event !== undefined) {
      const event = this.props.event;

      this.state.uid = event.uid;
      this.state.title = event.title ? event.title : '';
      this.state.allDay = event.startDate.isDate;
      this.state.start = event.startDate.toString();
      this.state.end = event.endDate.toString();
      this.state.location = event.location ? event.location : '';
      this.state.description = event.description ? event.description : '';
    } else {
      this.state.uid = uuid.v4();
    }

    if (this.props.collections[0]) {
      this.state.journalUid = props.collections[0].uid;
    }
    this.onSubmit = this.onSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.toggleAllDay = this.toggleAllDay.bind(this);
  }

  componentWillReceiveProps(nextProps: any) {
    if (this.props.collections !== nextProps.collections) {
      if (nextProps.collections[0]) {
        this.setState({journalUid: nextProps.collections[0].uid});
      }
    }
  }

  handleChange(name: string, value: string) {
    this.setState({
      [name]: value
    });

  }

  handleInputChange(event: any) {
    const name = event.target.name;
    const value = event.target.value;
    this.handleChange(name, value);
  }

  toggleAllDay() {
    this.setState({allDay: !this.state.allDay});
  }

  onSubmit(e: any) {
    e.preventDefault();

    if ((this.state.start === '') || (this.state.end === '')) {
      return;
    }

    let event = new EventType();
    event.uid = this.state.uid;
    event.summary = this.state.title;
    event.startDate = ICAL.Time.fromString(this.state.start);
    event.endDate = ICAL.Time.fromString(this.state.end);
    event.location = this.state.location;
    event.description = this.state.description;

    this.props.onSave(event, this.state.journalUid, this.props.event);
  }

  render() {
    const styles = {
      form: {
      },
      fullWidth: {
        width: '100%',
        boxSizing: 'border-box',
      },
      submit: {
        marginTop: 40,
        textAlign: 'right',
      },
    };

    return (
      <React.Fragment>
        <h2>
          {this.props.event ? 'Edit Event' : 'New Event'}
        </h2>
        <form style={styles.form} onSubmit={this.onSubmit}>
          <TextField
            name="title"
            hintText="Enter title"
            style={styles.fullWidth}
            value={this.state.title}
            onChange={this.handleInputChange}
          />

          <SelectField
            style={styles.fullWidth}
            value={this.state.journalUid}
            floatingLabelText="Saving to"
            disabled={this.props.event !== undefined}
            onChange={(event: object, key: number, payload: any) => this.handleChange('journalUid', payload)}
          >
            {this.props.collections.map((x) => (
              <MenuItem key={x.uid} value={x.uid} primaryText={x.displayName} />
            ))}
          </SelectField>

          <Toggle
            label="All Day"
            name="allDay"
            toggled={this.state.allDay}
            onToggle={this.toggleAllDay}
          />

          <div>
            <DateTimePicker
              dateOnly={this.state.allDay}
              value={this.state.start}
              onChange={(date: Date) => this.setState({start: date})}
            />
          </div>

          <div>
            <DateTimePicker
              dateOnly={this.state.allDay}
              value={this.state.end}
              onChange={(date: Date) => this.setState({end: date})}
            />
          </div>

          <TextField
            name="location"
            hintText="Add location"
            style={styles.fullWidth}
            value={this.state.location}
            onChange={this.handleInputChange}
          />

          <TextField
            name="description"
            hintText="Add description"
            multiLine={true}
            style={styles.fullWidth}
            value={this.state.description}
            onChange={this.handleInputChange}
          />

          <div style={styles.submit}>
            <RaisedButton
              type="submit"
              label="Save"
              secondary={true}
            />
          </div>
        </form>
      </React.Fragment>
    );
  }
}

export default EventEdit;
