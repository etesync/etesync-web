// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import * as colors from "@material-ui/core/colors";

import IconDelete from "@material-ui/icons/Delete";
import IconAdd from "@material-ui/icons/Add";
import IconClear from "@material-ui/icons/Clear";
import IconCancel from "@material-ui/icons/Clear";
import IconSave from "@material-ui/icons/Save";

import ConfirmationDialog from "../widgets/ConfirmationDialog";

import { CachedCollection } from "../Pim/helpers";

import * as uuid from "uuid";
import * as ICAL from "ical.js";

import { ContactType } from "../pim-types";

import { History } from "history";

const telTypes = [
  { type: "Home" },
  { type: "Work" },
  { type: "Cell" },
  { type: "Other" },
];

const emailTypes = telTypes;

const addressTypes = [
  { type: "Home" },
  { type: "Work" },
  { type: "Other" },
];

const imppTypes = [
  { type: "Jabber" },
  { type: "Hangouts" },
  { type: "Other" },
];

const TypeSelector = (props: any) => {
  const types = props.types as Array<{ type: string }>;

  return (
    <Select
      style={props.style}
      value={props.value}
      onChange={props.onChange}
    >
      {types.map((x) => (
        <MenuItem key={x.type} value={x.type.toLowerCase()}>{x.type}</MenuItem>
      ))}
    </Select>
  );
};

class ValueType {
  public type: string;
  public value: string;

  constructor(type?: string, value?: string) {
    this.type = type ? type : "home";
    this.value = value ? value : "";
  }
}

interface ValueTypeComponentProps {
  type?: string;
  style?: object;
  multiline?: boolean;

  types: Array<{ type: string }>;
  name: string;
  placeholder: string;
  value: ValueType;
  onClearRequest: (name: string) => void;
  onChange: (name: string, type: string, value: string) => void;
}

const ValueTypeComponent = (props: ValueTypeComponentProps) => {
  return (
    <React.Fragment>
      <TextField
        type={props.type}
        placeholder={props.placeholder}
        multiline={props.multiline}
        style={props.style}
        value={props.value.value}
        onChange={(event: React.ChangeEvent<any>) => props.onChange(props.name, props.value.type, event.target.value)}
      />
      <IconButton
        onClick={() => props.onClearRequest(props.name)}
        title="Remove"
      >
        <IconClear />
      </IconButton>
      <TypeSelector
        value={props.value.type}
        types={props.types}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => (
          props.onChange(props.name, event.target.value, props.value.value)
        )}
      />
    </React.Fragment>
  );
};

interface PropsType {
  collections: CachedCollection[];
  initialCollection?: string;
  item?: ContactType;
  newGroup?: boolean;
  onSave: (contact: ContactType, collectionUid: string, originalContact?: ContactType) => Promise<void>;
  onDelete: (contact: ContactType, collectionUid: string) => void;
  onCancel: () => void;
  history: History<any>;
}

class ContactEdit extends React.PureComponent<PropsType> {
  public state: {
    uid: string;
    fn: string;
    lastName: string;
    firstName: string;
    middleName: string;
    namePrefix: string;
    nameSuffix: string;
    phone: ValueType[];
    email: ValueType[];
    address: ValueType[];
    impp: ValueType[];
    org: string;
    note: string;
    title: string;
    group: boolean;

    collectionUid: string;
    showDeleteDialog: boolean;
  };

  constructor(props: PropsType) {
    super(props);
    this.state = {
      uid: "",
      fn: "",
      lastName: "",
      firstName: "",
      middleName: "",
      namePrefix: "",
      nameSuffix: "",
      phone: [new ValueType()],
      email: [new ValueType()],
      address: [new ValueType()],
      impp: [new ValueType("jabber")],
      org: "",
      note: "",
      title: "",
      group: false,

      collectionUid: "",
      showDeleteDialog: false,
    };

    if (this.props.item !== undefined) {
      const contact = this.props.item;

      this.state.group = contact.group;
      this.state.uid = contact.uid;
      this.state.fn = contact.fn ? contact.fn : "";
      if (contact.n) {
        this.state.lastName = contact.n[0];
        this.state.firstName = contact.n[1];
        this.state.middleName = contact.n[2];
        this.state.namePrefix = contact.n[3];
        this.state.nameSuffix = contact.n[4];
      } else {
        let name = this.state.fn.trim().split(",");
        if (name.length > 2 && name[0] !== "" && name[name.length - 1] !== "") {
          this.state.nameSuffix = name.pop() || "";
        }
        name = name.join(",").split(" ");
        if (name.length === 1) {
          this.state.firstName = name[0];
        } else if (name.length === 2) {
          this.state.firstName = name[0];
          this.state.lastName = name[1];
        } else if (name.length > 2) {
          this.state.firstName = name.slice(0, name.length - 2).join(" ");
          this.state.middleName = name[name.length - 2];
          this.state.lastName = name[name.length - 1];
        }
      }

      // FIXME: Am I really getting all the values this way?
      const propToValueType = (comp: ICAL.Component, propName: string) => (
        comp.getAllProperties(propName).map((prop) => (
          new ValueType(
            prop.toJSON()[1].type,
            prop.getFirstValue()
          )
        ))
      );

      this.state.phone = propToValueType(contact.comp, "tel");
      this.state.email = propToValueType(contact.comp, "email");
      this.state.address = propToValueType(contact.comp, "adr");
      this.state.impp = propToValueType(contact.comp, "impp");

      const propToStringType = (comp: ICAL.Component, propName: string) => {
        const val = comp.getFirstPropertyValue(propName);
        return val ? val : "";
      };

      this.state.org = propToStringType(contact.comp, "org");
      this.state.title = propToStringType(contact.comp, "title");
      this.state.note = propToStringType(contact.comp, "note");

    } else {
      this.state.uid = uuid.v4();
    }

    if (props.initialCollection) {
      this.state.collectionUid = props.initialCollection;
    } else if (props.collections[0]) {
      this.state.collectionUid = props.collections[0].collection.uid;
    }
    this.onSubmit = this.onSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleValueTypeChange = this.handleValueTypeChange.bind(this);
    this.addValueType = this.addValueType.bind(this);
    this.removeValueType = this.removeValueType.bind(this);
    this.onDeleteRequest = this.onDeleteRequest.bind(this);
  }

  public addValueType(name: string, _type?: string) {
    const type = _type ? _type : "home";
    this.setState((prevState) => {
      const newArray = prevState[name].slice(0);
      newArray.push(new ValueType(type));
      return {
        ...prevState,
        [name]: newArray,
      };
    });
  }

  public removeValueType(name: string, idx: number) {
    this.setState((prevState) => {
      const newArray = prevState[name].slice(0);
      newArray.splice(idx, 1);
      return {
        ...prevState,
        [name]: newArray,
      };
    });
  }

  public handleValueTypeChange(name: string, idx: number, value: ValueType) {
    this.setState((prevState) => {
      const newArray = prevState[name].slice(0);
      newArray[idx] = value;
      return {
        ...prevState,
        [name]: newArray,
      };
    });
  }

  public handleChange(name: string, value: string) {
    this.setState({
      [name]: value,
    });

  }

  public handleInputChange(contact: any) {
    const name = contact.target.name;
    const value = contact.target.value;
    this.handleChange(name, value);
  }

  public onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    const contact = (this.props.item) ?
      this.props.item.clone()
      :
      new ContactType(new ICAL.Component(["vcard", [], []]))
      ;

    const comp = contact.comp;
    comp.updatePropertyWithValue("prodid", "-//iCal.js EteSync Web");
    comp.updatePropertyWithValue("version", "4.0");
    comp.updatePropertyWithValue("uid", this.state.uid);
    comp.updatePropertyWithValue("rev", ICAL.Time.now());
    if (this.props.newGroup) {
      comp.updatePropertyWithValue("kind", "group");
    }

    const lastName = this.state.lastName.trim();
    const firstName = this.state.firstName.trim();
    const middleName = this.state.middleName.trim();
    const namePrefix = this.state.namePrefix.trim();
    const nameSuffix = this.state.nameSuffix.trim();
    
    let fn = `${namePrefix} ${firstName} ${middleName} ${lastName}`.trim();

    if (fn === "") { 
      fn = nameSuffix;
    } else if (nameSuffix !== "") { 
      fn = `${fn}, ${nameSuffix}`;
    }

    comp.updatePropertyWithValue("fn", fn);

    const name = [lastName,
      firstName,
      middleName,
      namePrefix,
      nameSuffix,
    ];

    comp.updatePropertyWithValue("n", name);

    function setProperties(name: string, source: ValueType[]) {
      comp.removeAllProperties(name);
      source.forEach((x) => {
        if (x.value === "") {
          return;
        }

        const prop = new ICAL.Property(name, comp);
        prop.setParameter("type", x.type);
        prop.setValue(x.value);
        comp.addProperty(prop);
      });
    }

    function setProperty(name: string, value: string) {
      comp.removeAllProperties(name);
      if (value !== "") {
        comp.updatePropertyWithValue(name, value);
      }
    }


    if (!this.props.newGroup && !this.state.group) {
      setProperties("tel", this.state.phone);
      setProperties("email", this.state.email);
      setProperties("adr", this.state.address);
      setProperties("impp", this.state.impp.map((x) => (
        { type: x.type, value: x.type + ":" + x.value }
      )));

      setProperty("org", this.state.org);
      setProperty("title", this.state.title);
      setProperty("note", this.state.note);
    }

    this.props.onSave(contact, this.state.collectionUid, this.props.item)
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
        width: "100%",
        boxSizing: "border-box" as any,
      },
      submit: {
        marginTop: 40,
        marginBottom: 20,
        textAlign: "right" as any,
      },
    };

    return (
      <React.Fragment>
        <h2>
          {this.props.item ? this.state.group ? "Edit Group" : "Edit Contact" : this.props.newGroup ? "New Group" : "New Contact"}
        </h2>
        <form style={styles.form} onSubmit={this.onSubmit}>
          <FormControl disabled={this.props.item !== undefined} style={styles.fullWidth}>
            <InputLabel>
              Saving to
            </InputLabel>
            <Select
              name="collectionUid"
              value={this.state.collectionUid}
              onChange={this.handleInputChange}
            >
              {this.props.collections.map((x) => (
                <MenuItem key={x.collection.uid} value={x.collection.uid}>{x.metadata.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {this.props.newGroup || this.state.group ?
            <TextField
              name="firstName"
              placeholder="Name"
              style={{ marginTop: "2rem", ...styles.fullWidth }}
              value={this.state.firstName}
              onChange={this.handleInputChange}
            />
            :
            <>
              <TextField
                name="namePrefix"
                placeholder="Prefix"
                style={{ marginTop: "2rem", ...styles.fullWidth }}
                value={this.state.namePrefix}
                onChange={this.handleInputChange}
              />

              <TextField
                name="firstName"
                placeholder="First name"
                style={{ marginTop: "2rem", ...styles.fullWidth }}
                value={this.state.firstName}
                onChange={this.handleInputChange}
              />

              <TextField
                name="middleName"
                placeholder="Middle name"
                style={{ marginTop: "2rem", ...styles.fullWidth }}
                value={this.state.middleName}
                onChange={this.handleInputChange}
              />

              <TextField
                name="lastName"
                placeholder="Last name"
                style={{ marginTop: "2rem", ...styles.fullWidth }}
                value={this.state.lastName}
                onChange={this.handleInputChange}
              />

              <TextField
                name="nameSuffix"
                placeholder="Suffix"
                style={{ marginTop: "2rem", ...styles.fullWidth }}
                value={this.state.nameSuffix}
                onChange={this.handleInputChange}
              />

              <div>
                Phone numbers
                <IconButton
                  onClick={() => this.addValueType("phone")}
                  title="Add phone number"
                >
                  <IconAdd />
                </IconButton>
              </div>
              {this.state.phone.map((x, idx) => (
                <ValueTypeComponent
                  key={idx}
                  name="phone"
                  placeholder="Phone"
                  types={telTypes}
                  value={x}
                  onClearRequest={(name: string) => this.removeValueType(name, idx)}
                  onChange={(name: string, type: string, value: string) => (
                    this.handleValueTypeChange(name, idx, { type, value })
                  )}
                />
              ))}

              <div>
                Emails
                <IconButton
                  onClick={() => this.addValueType("email")}
                  title="Add email address"
                >
                  <IconAdd />
                </IconButton>
              </div>
              {this.state.email.map((x, idx) => (
                <ValueTypeComponent
                  key={idx}
                  name="email"
                  placeholder="Email"
                  types={emailTypes}
                  value={x}
                  onClearRequest={(name: string) => this.removeValueType(name, idx)}
                  onChange={(name: string, type: string, value: string) => (
                    this.handleValueTypeChange(name, idx, { type, value })
                  )}
                />
              ))}

              <div>
                IMPP
                <IconButton
                  onClick={() => this.addValueType("impp", "jabber")}
                  title="Add impp address"
                >
                  <IconAdd />
                </IconButton>
              </div>
              {this.state.impp.map((x, idx) => (
                <ValueTypeComponent
                  key={idx}
                  name="impp"
                  placeholder="IMPP"
                  types={imppTypes}
                  value={x}
                  onClearRequest={(name: string) => this.removeValueType(name, idx)}
                  onChange={(name: string, type: string, value: string) => (
                    this.handleValueTypeChange(name, idx, { type, value })
                  )}
                />
              ))}

              <div>
                Addresses
                <IconButton
                  onClick={() => this.addValueType("address")}
                  title="Add address"
                >
                  <IconAdd />
                </IconButton>
              </div>
              {this.state.address.map((x, idx) => (
                <ValueTypeComponent
                  key={idx}
                  name="address"
                  placeholder="Address"
                  types={addressTypes}
                  multiline
                  value={x}
                  onClearRequest={(name: string) => this.removeValueType(name, idx)}
                  onChange={(name: string, type: string, value: string) => (
                    this.handleValueTypeChange(name, idx, { type, value })
                  )}
                />
              ))}

              <TextField
                name="org"
                placeholder="Organization"
                style={styles.fullWidth}
                value={this.state.org}
                onChange={this.handleInputChange}
              />

              <TextField
                name="title"
                placeholder="Title"
                style={styles.fullWidth}
                value={this.state.title}
                onChange={this.handleInputChange}
              />

              <TextField
                name="note"
                multiline
                placeholder="Note"
                style={styles.fullWidth}
                value={this.state.note}
                onChange={this.handleInputChange}
              />
            </>
          }

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
                style={{ marginLeft: 15, backgroundColor: colors.red[500], color: "white" }}
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
        </form>

        <ConfirmationDialog
          title="Delete Confirmation"
          labelOk="Delete"
          open={this.state.showDeleteDialog}
          onOk={() => this.props.onDelete(this.props.item!, this.props.initialCollection!)}
          onCancel={() => this.setState({ showDeleteDialog: false })}
        >
          {`Are you sure you would like to delete this ${this.state.group ? "group" : "contact"}?`}
        </ConfirmationDialog>
      </React.Fragment>
    );
  }
}

export default ContactEdit;
