import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import { red500, fullWhite } from 'material-ui/styles/colors';
import IconDelete from 'material-ui/svg-icons/action/delete';

import IconAdd from 'material-ui/svg-icons/content/add';
import IconClear from 'material-ui/svg-icons/content/clear';
import IconCancel from 'material-ui/svg-icons/content/clear';
import IconSave from 'material-ui/svg-icons/content/save';

import ConfirmationDialog from '../widgets/ConfirmationDialog';

import * as uuid from 'uuid';
import * as ICAL from 'ical.js';

import * as EteSync from '../api/EteSync';

import { ContactType } from '../pim-types';

const telTypes = [
  {type: 'Home'},
  {type: 'Work'},
  {type: 'Cell'},
  {type: 'Other'},
];

const emailTypes = telTypes;

const addressTypes = [
  {type: 'Home'},
  {type: 'Work'},
  {type: 'Other'},
];

const imppTypes = [
  {type: 'Jabber'},
  {type: 'Hangouts'},
  {type: 'Other'},
];

const TypeSelector = (props: any) => {
  const types = props.types as {type: string}[];

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

  types: {type: string}[];
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
        onChange={(event: React.ChangeEvent<any>) => props.onChange(props.name, props.value.type, event.target.value)}
      />
      <IconButton
        onClick={() => props.onClearRequest(props.name)}
        tooltip="Remove"
      >
        <IconClear />
      </IconButton>
      <TypeSelector
        value={props.value.type}
        types={props.types}
        onChange={
          (contact: object, key: number, payload: any) => props.onChange(props.name, payload, props.value.value)
        }
      />
    </React.Fragment>
  );
};

class ContactEdit extends React.PureComponent {
  state: {
    uid: string,
    fn: string;
    phone: ValueType[];
    email: ValueType[];
    address: ValueType[];
    impp: ValueType[];
    org: string;
    note: string;
    title: string;

    journalUid: string;
    showDeleteDialog: boolean;
  };

  props: {
    collections: Array<EteSync.CollectionInfo>,
    initialCollection?: string,
    item?: ContactType,
    onSave: (contact: ContactType, journalUid: string, originalContact?: ContactType) => void;
    onDelete: (contact: ContactType, journalUid: string) => void;
    onCancel: () => void;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      uid: '',
      fn: '',
      phone: [new ValueType()],
      email: [new ValueType()],
      address: [new ValueType()],
      impp: [new ValueType()],
      org: '',
      note: '',
      title: '',

      journalUid: '',
      showDeleteDialog: false,
    };

    if (this.props.item !== undefined) {
      const contact = this.props.item;

      this.state.uid = contact.uid;
      this.state.fn = contact.fn ? contact.fn : '';

      // FIXME: Am I really getting all the values this way?
      const propToValueType = (comp: ICAL.Component, propName: string) => (
        comp.getAllProperties(propName).map((prop) => (
          new ValueType(
            prop.toJSON()[1].type,
            prop.getFirstValue()
          )
        ))
      );

      this.state.phone = propToValueType(contact.comp, 'tel');
      this.state.email = propToValueType(contact.comp, 'email');
      this.state.address = propToValueType(contact.comp, 'adr');
      this.state.impp = propToValueType(contact.comp, 'impp');

      const propToStringType = (comp: ICAL.Component, propName: string) => {
        const val = comp.getFirstPropertyValue(propName);
        return val ? val : '';
      };

      this.state.org = propToStringType(contact.comp, 'org');
      this.state.title = propToStringType(contact.comp, 'title');
      this.state.note = propToStringType(contact.comp, 'note');

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
    this.handleValueTypeChange = this.handleValueTypeChange.bind(this);
    this.addValueType = this.addValueType.bind(this);
    this.removeValueType = this.removeValueType.bind(this);
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

  addValueType(name: string, _type?: string) {
    const type = _type ? _type : 'home';
    this.setState((prevState, props) => {
      let newArray = prevState[name].slice(0);
      newArray.push(new ValueType(type));
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

  onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    let contact = (this.props.item) ?
      this.props.item.clone()
      :
      new ContactType(new ICAL.Component(['vcard', [], []]))
    ;

    let comp = contact.comp;
    comp.updatePropertyWithValue('prodid', '-//iCal.js EteSync Web');
    comp.updatePropertyWithValue('version', '4.0');
    comp.updatePropertyWithValue('uid', this.state.uid);
    comp.updatePropertyWithValue('fn', this.state.fn);
    comp.updatePropertyWithValue('rev', ICAL.Time.now());

    function setProperties(name: string, source: ValueType[]) {
      comp.removeAllProperties(name);
      source.forEach((x) => {
        if (x.value === '') {
          return;
        }

        let prop = new ICAL.Property(name, comp);
        prop.setParameter('type', x.type);
        prop.setValue(x.value);
        comp.addProperty(prop);
      });
    }

    setProperties('tel', this.state.phone);
    setProperties('email', this.state.email);
    setProperties('adr', this.state.address);
    setProperties('impp', this.state.impp.map((x) => (
      {type: x.type, value: x.type + ':' + x.value}
    )));

    function setProperty(name: string, value: string) {
      comp.removeAllProperties(name);
      if (value !== '') {
        comp.updatePropertyWithValue(name, value);
      }
    }

    setProperty('org', this.state.org);
    setProperty('title', this.state.title);
    setProperty('note', this.state.note);

    this.props.onSave(contact, this.state.journalUid, this.props.item);
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
          {this.props.item ? 'Edit Contact' : 'New Contact'}
        </h2>
        <form style={styles.form} onSubmit={this.onSubmit}>
          <SelectField
            style={styles.fullWidth}
            value={this.state.journalUid}
            floatingLabelText="Saving to"
            disabled={this.props.item !== undefined}
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
              onClick={() => this.addValueType('phone')}
              tooltip="Add phone number"
            >
              <IconAdd />
            </IconButton>
          </div>
          {this.state.phone.map((x, idx) => (
            <ValueTypeComponent
              key={idx}
              name="phone"
              hintText="Phone"
              types={telTypes}
              value={this.state.phone[idx]}
              onClearRequest={(name: string) => this.removeValueType(name, idx)}
              onChange={(name: string, type: string, value: string) => (
                this.handleValueTypeChange(name, idx, {type, value})
              )}
            />
          ))}

          <div>
            Emails
            <IconButton
              onClick={() => this.addValueType('email')}
              tooltip="Add email address"
            >
              <IconAdd />
            </IconButton>
          </div>
          {this.state.email.map((x, idx) => (
            <ValueTypeComponent
              key={idx}
              name="email"
              hintText="Email"
              types={emailTypes}
              value={this.state.email[idx]}
              onClearRequest={(name: string) => this.removeValueType(name, idx)}
              onChange={(name: string, type: string, value: string) => (
                this.handleValueTypeChange(name, idx, {type, value})
              )}
            />
          ))}

          <div>
            IMPP
            <IconButton
              onClick={() => this.addValueType('impp', 'jabber')}
              tooltip="Add impp address"
            >
              <IconAdd />
            </IconButton>
          </div>
          {this.state.impp.map((x, idx) => (
            <ValueTypeComponent
              key={idx}
              name="impp"
              hintText="IMPP"
              types={imppTypes}
              value={this.state.impp[idx]}
              onClearRequest={(name: string) => this.removeValueType(name, idx)}
              onChange={(name: string, type: string, value: string) => (
                this.handleValueTypeChange(name, idx, {type, value})
              )}
            />
          ))}

          <div>
            Addresses
            <IconButton
              onClick={() => this.addValueType('address')}
              tooltip="Add address"
            >
              <IconAdd />
            </IconButton>
          </div>
          {this.state.address.map((x, idx) => (
            <ValueTypeComponent
              key={idx}
              name="address"
              hintText="Address"
              types={addressTypes}
              value={this.state.address[idx]}
              onClearRequest={(name: string) => this.removeValueType(name, idx)}
              onChange={(name: string, type: string, value: string) => (
                this.handleValueTypeChange(name, idx, {type, value})
              )}
            />
          ))}

          <TextField
            name="org"
            hintText="Organization"
            style={styles.fullWidth}
            value={this.state.org}
            onChange={this.handleInputChange}
          />

          <TextField
            name="title"
            hintText="Title"
            style={styles.fullWidth}
            value={this.state.title}
            onChange={this.handleInputChange}
          />

          <TextField
            name="note"
            multiLine={true}
            hintText="Note"
            style={styles.fullWidth}
            value={this.state.note}
            onChange={this.handleInputChange}
          />

          <div style={styles.submit}>
            <RaisedButton
              label="Cancel"
              onClick={this.props.onCancel}
              icon={<IconCancel />}
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

export default ContactEdit;
