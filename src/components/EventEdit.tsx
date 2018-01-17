import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Toggle from 'material-ui/Toggle';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import { red500, fullWhite } from 'material-ui/styles/colors';
import IconDelete from 'material-ui/svg-icons/action/delete';

import IconCancel from 'material-ui/svg-icons/content/clear';
import IconSave from 'material-ui/svg-icons/content/save';

import DateTimePicker from '../widgets/DateTimePicker';

import ConfirmationDialog from '../widgets/ConfirmationDialog';

import * as uuid from 'uuid';
import * as ICAL from 'ical.js';

import * as EteSync from '../api/EteSync';

import { EventType } from '../pim-types';

class EventEdit extends React.PureComponent {
  state: {
    uid: string,
    title: string;
    allDay: boolean;
    start?: Date;
    end?: Date;
    location: string;
    description: string;
    journalUid: string;

    error?: string;
    showDeleteDialog: boolean;
  };

  props: {
    collections: Array<EteSync.CollectionInfo>,
    initialCollection?: string,
    item?: EventType,
    onSave: (event: EventType, journalUid: string, originalEvent?: EventType) => void;
    onDelete: (event: EventType, journalUid: string) => void;
    onCancel: () => void;
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
      showDeleteDialog: false,
    };
    if (this.props.item !== undefined) {
      const event = this.props.item;

      const allDay = event.startDate.isDate;
      let endDate = event.endDate.clone();

      if (allDay) {
        endDate.adjust(-1, 0, 0, 0);
      }

      this.state.uid = event.uid;
      this.state.title = event.title ? event.title : '';
      this.state.allDay = allDay;
      this.state.start = event.startDate.toJSDate();
      this.state.end = endDate.toJSDate();
      this.state.location = event.location ? event.location : '';
      this.state.description = event.description ? event.description : '';
    } else {
      this.state.uid = uuid.v4();
    }

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

  componentWillReceiveProps(nextProps: any) {
    if ((this.props.collections !== nextProps.collections) ||
      (this.props.initialCollection !== nextProps.initialCollection)) {
      if (nextProps.initialCollection) {
        this.state.journalUid = nextProps.initialCollection;
      } else if (nextProps.collections[0]) {
        this.state.journalUid = nextProps.collections[0].uid;
      }
    }
  }

  handleChange(name: string, value: string) {
    this.setState({
      [name]: value
    });

  }

  handleInputChange(event: React.ChangeEvent<any>) {
    const name = event.target.name;
    const value = event.target.value;
    this.handleChange(name, value);
  }

  toggleAllDay() {
    this.setState({allDay: !this.state.allDay});
  }

  onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    if ((!this.state.start) || (!this.state.end)) {
      this.setState({error: 'Both start and end time must be set!'});
      return;
    }

    function fromDate(date: Date, allDay: boolean) {
      const ret = ICAL.Time.fromJSDate(date, false);
      if (!allDay) {
        return ret;
      } else {
        let data = ret.toJSON();
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
      this.setState({error: 'End time must be later than start time!'});
      return;
    }

    let event = (this.props.item) ?
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

    event.component.updatePropertyWithValue('last-modified', ICAL.Time.now());

    this.props.onSave(event, this.state.journalUid, this.props.item);
  }

  onDeleteRequest() {
    this.setState({
      showDeleteDialog: true
    });
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
        marginBottom: 20,
        textAlign: 'right',
      },
    };

    return (
      <React.Fragment>
        <h2>
          {this.props.item ? 'Edit Event' : 'New Event'}
        </h2>
        {this.state.error && (
          <div>ERROR! {this.state.error}</div>
        )}
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
            disabled={this.props.item !== undefined}
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
              placeholder="Start"
              value={this.state.start}
              onChange={(date?: Date) => this.setState({start: date})}
            />
          </div>

          <div>
            <DateTimePicker
              dateOnly={this.state.allDay}
              placeholder="End"
              value={this.state.end}
              onChange={(date?: Date) => this.setState({end: date})}
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
              label="Cancel"
              icon={<IconCancel />}
              onClick={this.props.onCancel}
            />

            {this.props.item &&
              <RaisedButton
                label="Delete"
                labelColor={fullWhite}
                backgroundColor={red500}
                style={{marginLeft: 15}}
                icon={<IconDelete color={fullWhite} />}
                onClick={this.onDeleteRequest}
              />
            }

            <RaisedButton
              type="submit"
              label="Save"
              secondary={true}
              icon={<IconSave />}
              style={{marginLeft: 15}}
            />
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
        onCancel={() => this.setState({showDeleteDialog: false})}
      >
        Are you sure you would like to delete this contact?
      </ConfirmationDialog>
      </React.Fragment>
    );
  }
}

export default EventEdit;
