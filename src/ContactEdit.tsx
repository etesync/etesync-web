import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import IconAdd from 'material-ui/svg-icons/content/add';
import IconClear from 'material-ui/svg-icons/content/clear';

import * as uuid from 'uuid';
import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

import { ContactType } from './pim-types';

const TypeSelector = (props: any) => {
  const types = [
    {type: 'Home'},
    {type: 'Work'},
    {type: 'Other'},
  ];

  return (
    <SelectField
      style={props.style}
      value={props.value}
      onChange={props.onChange}
    >
      {types.map((x) => (
        <MenuItem key={x.type} value={x.type.toLowerCase()} primaryText={x.type} />
      ))}
    </SelectField>
  );
};

class ValueType {
  type: string;
  value: string;

  constructor(type?: string, value?: string) {
    this.type = type ? type : 'home';
    this.value = value ? value : '';
  }
}

interface ValueTypeComponentProps {
  type?: string;
  style?: object;

  name: string;
  hintText: string;
  value: ValueType;
  onClearRequest: (name: string) => void;
  onChange: (name: string, type: string, value: string) => void;
}

const ValueTypeComponent = (props: ValueTypeComponentProps) => {
  return (
    <React.Fragment>
      <TextField
        type={props.type}
        name={props.name}
        hintText={props.hintText}
        style={props.style}
        value={props.value.value}
        onChange={(event: any) => props.onChange(props.name, props.value.type, event.target.value)}
      />
      <IconButton
        onClick={() => props.onClearRequest(props.name)}
        tooltip="Remove"
      >
        <IconClear />
      </IconButton>
      <TypeSelector
        value={props.value.type}
        onChange={
          (contact: object, key: number, payload: any) => props.onChange(props.name, payload, props.value.value)
        }
      />
    </React.Fragment>
  );
};

class ContactEdit extends React.Component {
  state: {
    uid: string,
    fn: string;
    phones: ValueType[];
    emails: ValueType[];

    journalUid: string;
  };

  props: {
    collections: Array<EteSync.CollectionInfo>,
    initialCollection?: string,
    contact?: ContactType,
    onSave: (contact: ContactType, journalUid: string, originalContact?: ContactType) => void;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      uid: '',
      fn: '',
      phones: [new ValueType()],
      emails: [new ValueType()],

      journalUid: '',
    };
    if (this.props.contact !== undefined) {
      const contact = this.props.contact;

      this.state.uid = contact.uid;
      this.state.fn = contact.fn ? contact.fn : '';
    } else {
      this.state.uid = uuid.v4();
    }

    if (props.collections[0]) {
      this.state.journalUid = props.collections[0].uid;
    }
    this.onSubmit = this.onSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleValueTypeChange = this.handleValueTypeChange.bind(this);
    this.addValueType = this.addValueType.bind(this);
    this.removeValueType = this.removeValueType.bind(this);
  }

  componentWillReceiveProps(nextProps: any) {
    if (this.props.collections !== nextProps.collections) {
      if (nextProps.collections[0]) {
        this.setState({journalUid: nextProps.collections[0].uid});
      }
    }
  }

  addValueType(name: string) {
    this.setState((prevState, props) => {
      let newArray = prevState[name].slice(0);
      newArray.push(new ValueType());
      return {
        ...prevState,
        [name]: newArray,
      };
    });
  }

  removeValueType(name: string, idx: number) {
    this.setState((prevState, props) => {
      let newArray = prevState[name].slice(0);
      newArray.splice(idx, 1);
      return {
        ...prevState,
        [name]: newArray,
      };
    });
  }

  handleValueTypeChange(name: string, idx: number, value: ValueType) {
    this.setState((prevState, props) => {
      let newArray = prevState[name].slice(0);
      newArray[idx] = value;
      return {
        ...prevState,
        [name]: newArray,
      };
    });
  }

  handleChange(name: string, value: string) {
    this.setState({
      [name]: value
    });

  }

  handleInputChange(contact: any) {
    const name = contact.target.name;
    const value = contact.target.value;
    this.handleChange(name, value);
  }

  onSubmit(e: any) {
    e.prcontactDefault();

    let contact = new ContactType(new ICAL.Component(['vcard', []]));
    //    contact.uid = this.state.uid;
    // contact.fn = this.state.fn;

    this.props.onSave(contact, this.state.journalUid, this.props.contact);
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
          {this.props.contact ? 'Edit Contact' : 'New Contact'}
        </h2>
        <form style={styles.form} onSubmit={this.onSubmit}>
          <SelectField
            style={styles.fullWidth}
            value={this.state.journalUid}
            floatingLabelText="Saving to"
            disabled={this.props.contact !== undefined}
            onChange={(contact: object, key: number, payload: any) => this.handleChange('journalUid', payload)}
          >
            {this.props.collections.map((x) => (
              <MenuItem key={x.uid} value={x.uid} primaryText={x.displayName} />
            ))}
          </SelectField>

          <TextField
            name="fn"
            hintText="Name"
            style={styles.fullWidth}
            value={this.state.fn}
            onChange={this.handleInputChange}
          />

          <div>
            Phone numbers
            <IconButton
              onClick={() => this.addValueType('phones')}
              tooltip="Add phone number"
            >
              <IconAdd />
            </IconButton>
          </div>
          {this.state.phones.map((x, idx) => (
            <ValueTypeComponent
              key={idx}
              name="phones"
              hintText="Phone"
              value={this.state.phones[idx]}
              onClearRequest={(name: string) => this.removeValueType(name, idx)}
              onChange={(name: string, type: string, value: string) => (
                this.handleValueTypeChange(name, idx, {type, value})
              )}
            />
          ))}

          <div>
            Emails
            <IconButton
              onClick={() => this.addValueType('emails')}
              tooltip="Add email address"
            >
              <IconAdd />
            </IconButton>
          </div>
          {this.state.emails.map((x, idx) => (
            <ValueTypeComponent
              key={idx}
              name="emails"
              hintText="Email"
              value={this.state.emails[idx]}
              onClearRequest={(name: string) => this.removeValueType(name, idx)}
              onChange={(name: string, type: string, value: string) => (
                this.handleValueTypeChange(name, idx, {type, value})
              )}
            />
          ))}

          <div style={styles.submit}>
            <RaisedButton
              type="submit"
              label="Save"
              secondary={true}
            />
          </div>

          <div>
            Not all types are supported at the moment. If you are editing a contact,
            the unsupported types will be copied as is.
          </div>
        </form>
      </React.Fragment>
    );
  }
}

export default ContactEdit;
