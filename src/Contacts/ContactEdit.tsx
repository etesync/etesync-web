// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import * as colors from "@material-ui/core/colors";

import IconDelete from "@material-ui/icons/Delete";
import IconClear from "@material-ui/icons/Clear";
import IconCancel from "@material-ui/icons/Clear";
import IconSave from "@material-ui/icons/Save";
import IconSaveTo from "@material-ui/icons/FolderOutlined";
import IconPerson from "@material-ui/icons/PersonOutlined";
import IconOrganization from "@material-ui/icons/BusinessOutlined";
import IconPhone from "@material-ui/icons/PhoneOutlined";
import IconEmail from "@material-ui/icons/EmailOutlined";
import IconImpp from "@material-ui/icons/SmsOutlined";
import IconAddress from "@material-ui/icons/LocationOnOutlined";
import IconNote from "@material-ui/icons/EditOutlined";
import IconGroup from "@material-ui/icons/GroupOutlined";
import IconExpandMore from "@material-ui/icons/ExpandMoreOutlined";
import IconExpandLess from "@material-ui/icons/ExpandLessOutlined";

import ConfirmationDialog from "../widgets/ConfirmationDialog";

import { CachedCollection } from "../Pim/helpers";

import * as uuid from "uuid";
import * as ICAL from "ical.js";

import { ContactType } from "../pim-types";

import { History } from "history";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { Grid } from "@material-ui/core";

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
      variant="outlined"
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
  typeLabel?: string;
  style?: object;
  multiline?: boolean;

  types: Array<{ type: string }>;
  name: string;
  label: string;
  value: ValueType;
  onClearRequest: (name: string) => void;
  onChange: (name: string, type: string, value: string) => void;
}

const ValueTypeComponent = (props: ValueTypeComponentProps) => {
  return (
    <React.Fragment>
      <Grid container item direction="row" spacing={2} alignItems="center">
        <Grid item xs>
          <TextField
            type={props.type}
            label={props.label}
            multiline={props.multiline}
            variant="outlined"
            style={props.style}
            value={props.value.value}
            onChange={(event: React.ChangeEvent<any>) => props.onChange(props.name, props.value.type, event.target.value)}
          />
        </Grid>

        <Grid item xs="auto">
          <TypeSelector
            value={props.value.type}
            lable={props.typeLabel}
            types={props.types}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => (
              props.onChange(props.name, event.target.value, props.value.value)
            )}
          />
        </Grid>

        <Grid item xs="auto">
          <IconButton
            onClick={() => props.onClearRequest(props.name)}
            title="Remove"
          >
            <IconClear />
          </IconButton>
        </Grid>
      </Grid> 
      
      
    </React.Fragment>
  );
};

interface PropsType {
  collections: CachedCollection[];
  initialCollection?: string;
  item?: ContactType;
  onSave: (contact: ContactType, collectionUid: string, originalContact?: ContactType) => Promise<void>;
  onDelete: (contact: ContactType, collectionUid: string) => void;
  onCancel: () => void;
  history: History<any>;
  allGroups: ContactType[];
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

    collectionUid: string;
    showDeleteDialog: boolean;
    collectionGroups: {};
    newGroups: string[];
    originalGroups: {};

    showAllNameFields: boolean;
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

      collectionUid: "",
      showDeleteDialog: false,
      collectionGroups: {},
      newGroups: [],
      originalGroups: [],

      showAllNameFields: false,
    };

    if (this.props.item !== undefined) {
      const contact = this.props.item;

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

    this.state.collectionGroups = this.getCollectionGroups(this.state.collectionUid);
    Object.values(this.state.collectionGroups).forEach((group: ContactType) => {
      if (group.members.includes(this.state.uid)) {
        this.state.newGroups.push(group.fn);
        this.state.originalGroups[group.fn] = undefined;
      }
    });

    this.onSubmit = this.onSubmit.bind(this);
    this.addMetadata = this.addMetadata.bind(this);
    this.getCollectionGroups = this.getCollectionGroups.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleCollectionChange = this.handleCollectionChange.bind(this);
    this.reloadGroupSuggestions = this.reloadGroupSuggestions.bind(this);
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

  public handleChange(name: string, value: string | string[]) {
    this.setState({
      [name]: value,
    });
  }

  public getCollectionGroups(collectionUid: string) {
    const groups = {};
    this.props.allGroups.forEach((group) => {
      if (collectionUid === group.collectionUid) {
        groups[group.fn] = group;
      }
    });
    return groups;
  }

  public reloadGroupSuggestions(collectionUid: string) {
    this.setState({
      collectionGroups: this.getCollectionGroups(collectionUid),
      newGroups: [],
    });
  }

  public handleCollectionChange(contact: any) {
    const name = contact.target.name;
    const value = contact.target.value;
    this.reloadGroupSuggestions(value);
    this.handleChange(name, value);
  }

  public handleInputChange(contact: any) {
    const name = contact.target.name;
    const value = contact.target.value;
    this.handleChange(name, value);
  }

  public addMetadata(item: ContactType, uid: string, isGroup: boolean) {
    const comp = item.comp;
    comp.updatePropertyWithValue("prodid", "-//iCal.js EteSync Web");
    comp.updatePropertyWithValue("version", "4.0");
    comp.updatePropertyWithValue("uid", uid);
    comp.updatePropertyWithValue("rev", ICAL.Time.now());
    if (isGroup) {
      comp.updatePropertyWithValue("kind", "group");
    }
  }

  public onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    const contact = (this.props.item) ?
      this.props.item.clone()
      :
      new ContactType(new ICAL.Component(["vcard", [], []]))
      ;

    const comp = contact.comp;
    this.addMetadata(contact, this.state.uid, false);

    // Add new groups
    this.state.newGroups.forEach((group) => {
      if (!this.state.collectionGroups[group]) {
        const newGroup = new ContactType(new ICAL.Component(["vcard", [], []]));
        this.addMetadata(newGroup, uuid.v4(), true);
        newGroup.comp.updatePropertyWithValue("fn", group.trim());
        newGroup.comp.updatePropertyWithValue("member", `urn:uuid:${this.state.uid}`);
        this.props.onSave(newGroup, this.state.collectionUid, undefined);
      } else if (!(group in this.state.originalGroups)) {
        const oldGroup = this.state.collectionGroups[group];
        const updatedGroup = oldGroup.clone();
        updatedGroup.comp.addPropertyWithValue("member", `urn:uuid:${this.state.uid}`);
        this.props.onSave(updatedGroup, this.state.collectionUid, oldGroup);
      }
    });

    // Remove deleted groups
    Object.keys(this.state.originalGroups).filter((x) => !this.state.newGroups.includes(x)).forEach((removed) => {
      const deletedGroup = this.state.collectionGroups[removed];
      const updatedGroup = deletedGroup.clone();
      const members = updatedGroup.members.filter((uid: string) => uid !== this.state.uid);
      updatedGroup.comp.removeAllProperties("member");
      members.forEach((m: string) => updatedGroup.comp.addPropertyWithValue("member", `urn:uuid:${m}`));
      this.props.onSave(updatedGroup, this.state.collectionUid, deletedGroup);
    });

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

    setProperties("tel", this.state.phone);
    setProperties("email", this.state.email);
    setProperties("adr", this.state.address);
    setProperties("impp", this.state.impp.map((x) => (
      { type: x.type, value: x.type + ":" + x.value }
    )));

    function setProperty(name: string, value: string) {
      comp.removeAllProperties(name);
      if (value !== "") {
        comp.updatePropertyWithValue(name, value);
      }
    }

    setProperty("org", this.state.org);
    setProperty("title", this.state.title);
    setProperty("note", this.state.note);

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
        <div style={{ paddingLeft: "0.5rem", paddingRight: "1rem" }}>
          <h2>
            {this.props.item ? "Edit Contact" : "New Contact"}
          </h2>
          <form style={styles.form} onSubmit={this.onSubmit}>
            <Grid container direction="column" spacing={4} style={{ marginTop: "0.5rem" }}>
              <Grid container item direction="row" spacing={2}>
                <Grid item xs="auto">
                  <IconSaveTo style={{ paddingTop: "1rem" }} />
                </Grid>

                <Grid item xs="auto">
                  <FormControl
                    disabled={this.props.item !== undefined}
                    style={styles.fullWidth}
                  >
                    <Select
                      name="collectionUid"
                      value={this.state.collectionUid}
                      variant="outlined"
                      onChange={this.handleCollectionChange}
                    >
                      {this.props.collections.map((x) => (
                        <MenuItem key={x.collection.uid} value={x.collection.uid}>{x.metadata.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container item direction="row" spacing={2}>
                <Grid item xs="auto">
                  <IconPerson style={{ paddingTop: "1rem" }} />
                </Grid>

                <Grid container item direction="column" spacing={2} xs>
                  {(this.state.showAllNameFields || this.state.namePrefix) &&
                    <Grid item>
                      <TextField
                        name="namePrefix"
                        label="Prefix"
                        variant="outlined"
                        style={{ ...styles.fullWidth }}
                        value={this.state.namePrefix}
                        onChange={this.handleInputChange}
                      />
                    </Grid>
                  }

                  <Grid item>
                    <TextField
                      name="firstName"
                      label="First name"
                      variant="outlined"
                      style={{ ...styles.fullWidth }}
                      value={this.state.firstName}
                      onChange={this.handleInputChange}
                    />
                  </Grid>

                  {(this.state.showAllNameFields || this.state.middleName) &&
                    <Grid item>
                      <TextField
                        name="middleName"
                        label="Middle name"
                        variant="outlined"
                        style={{ ...styles.fullWidth }}
                        value={this.state.middleName}
                        onChange={this.handleInputChange}
                      />
                    </Grid>
                  }

                  <Grid item>
                    <TextField
                      name="lastName"
                      label="Last name"
                      variant="outlined"
                      style={{ ...styles.fullWidth }}
                      value={this.state.lastName}
                      onChange={this.handleInputChange}
                    />
                  </Grid>

                  {(this.state.showAllNameFields || this.state.nameSuffix) &&
                    <Grid item>
                      <TextField
                        name="nameSuffix"
                        label="Suffix"
                        variant="outlined"
                        style={{ ...styles.fullWidth }}
                        value={this.state.nameSuffix}
                        onChange={this.handleInputChange}
                      />
                    </Grid>
                  }
                </Grid>

                <Grid item xs="auto">
                  <IconButton
                    onClick={() => this.setState({ showAllNameFields: !this.state.showAllNameFields })}
                    title="Show all name fields"
                  >
                    {this.state.showAllNameFields ? <IconExpandLess /> : <IconExpandMore />}
                  </IconButton>
                </Grid>
              </Grid>

              <Grid container item direction="row" spacing={2}>
                <Grid item xs="auto">
                  <IconPhone style={{ paddingTop: "1rem" }} />
                </Grid>

                <Grid container item direction="column" spacing={2} xs>
                  {this.state.phone.map((x, idx) => (
                    <ValueTypeComponent
                      key={idx}
                      name="phone"
                      label="Phone"
                      types={telTypes}
                      typeLabel="Label"
                      value={x}
                      style={{ ...styles.fullWidth }}
                      onClearRequest={(name: string) => this.removeValueType(name, idx)}
                      onChange={(name: string, type: string, value: string) => (
                        this.handleValueTypeChange(name, idx, { type, value })
                      )}
                    />
                  ))}

                  <Grid item xs="auto">
                    <Button
                      onClick={() => this.addValueType("phone")}
                      color="secondary"
                      variant="outlined"
                      style={{ height: "3.5rem", fontSize: "1em" }}
                    >
                      Add phone number
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid container item direction="row" spacing={2}>
                <Grid item xs="auto">
                  <IconOrganization style={{ paddingTop: "1rem" }} />
                </Grid>

                <Grid container item direction="column" spacing={2} xs>
                  <Grid item>
                    <TextField
                      name="org"
                      label="Organization"
                      variant="outlined"
                      style={styles.fullWidth}
                      value={this.state.org}
                      onChange={this.handleInputChange}
                    />
                  </Grid>
                  <Grid item>
                    <TextField
                      name="title"
                      label="Title"
                      variant="outlined"
                      style={styles.fullWidth}
                      value={this.state.title}
                      onChange={this.handleInputChange}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid container item direction="row" spacing={2}>
                <Grid item xs="auto">
                  <IconEmail style={{ paddingTop: "1rem" }} />
                </Grid>

                <Grid container item direction="column" spacing={2} xs>
                  {this.state.email.map((x, idx) => (
                    <ValueTypeComponent
                      key={idx}
                      name="email"
                      label="Email"
                      types={emailTypes}
                      style={{ ...styles.fullWidth }}
                      value={x}
                      onClearRequest={(name: string) => this.removeValueType(name, idx)}
                      onChange={(name: string, type: string, value: string) => (
                        this.handleValueTypeChange(name, idx, { type, value })
                      )}
                    />
                  ))}
                  <Grid item xs="auto">
                    <Button
                      onClick={() => this.addValueType("email")}
                      color="secondary"
                      variant="outlined"
                      style={{ height: "3.5rem", fontSize: "1em" }}
                    >
                      Add email address
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid container item direction="row" spacing={2}>
                <Grid item xs="auto">
                  <IconImpp style={{ paddingTop: "1rem" }} />
                </Grid>

                <Grid container item direction="column" spacing={2} xs>
                  {this.state.impp.map((x, idx) => (
                    <ValueTypeComponent
                      key={idx}
                      name="impp"
                      label="IMPP"
                      types={imppTypes}
                      style={{ ...styles.fullWidth }}
                      value={x}
                      onClearRequest={(name: string) => this.removeValueType(name, idx)}
                      onChange={(name: string, type: string, value: string) => (
                        this.handleValueTypeChange(name, idx, { type, value })
                      )}
                    />
                  ))}
                  <Grid item xs="auto">
                    <Button
                      onClick={() => this.addValueType("impp", "jabber")}
                      color="secondary"
                      variant="outlined"
                      style={{ height: "3.5rem", fontSize: "1em" }}
                    >
                      Add impp address
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid container item direction="row" spacing={2}>
                <Grid item xs="auto">
                  <IconAddress style={{ paddingTop: "1rem" }} />
                </Grid>

                <Grid container item direction="column" spacing={2} xs>
                  {this.state.address.map((x, idx) => (
                    <ValueTypeComponent
                      key={idx}
                      name="address"
                      label="Address"
                      types={addressTypes}
                      style={{ ...styles.fullWidth }}
                      multiline
                      value={x}
                      onClearRequest={(name: string) => this.removeValueType(name, idx)}
                      onChange={(name: string, type: string, value: string) => (
                        this.handleValueTypeChange(name, idx, { type, value })
                      )}
                    />
                  ))}
                  <Grid item xs="auto">
                    <Button
                      onClick={() => this.addValueType("address")}
                      color="secondary"
                      variant="outlined"
                      style={{ height: "3.5rem", fontSize: "1em" }}
                    >
                      Add address
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid container item direction="row" spacing={2}>
                <Grid item xs="auto">
                  <IconNote style={{ paddingTop: "1rem" }} />
                </Grid>

                <Grid item xs>
                  <TextField
                    name="note"
                    multiline
                    label="Note"
                    variant="outlined"
                    style={styles.fullWidth}
                    value={this.state.note}
                    onChange={this.handleInputChange}
                  />
                </Grid>
              </Grid>

              <Grid container item direction="row" spacing={2}>
                <Grid item xs="auto">
                  <IconGroup style={{ paddingTop: "1rem" }} />
                </Grid>

                <Grid item xs>
                  <Autocomplete
                    style={styles.fullWidth}
                    freeSolo
                    multiple
                    clearOnBlur
                    selectOnFocus
                    options={Object.keys(this.state.collectionGroups)}
                    value={this.state.newGroups}
                    onChange={(_e, value) => this.handleChange("newGroups", value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Groups"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>

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
        </div>

        <ConfirmationDialog
          title="Delete Confirmation"
          labelOk="Delete"
          open={this.state.showDeleteDialog}
          onOk={() => this.props.onDelete(this.props.item!, this.props.initialCollection!)}
          onCancel={() => this.setState({ showDeleteDialog: false })}
        >
          Are you sure you would like to delete this contact?
        </ConfirmationDialog>
      </React.Fragment>
    );
  }
}

export default ContactEdit;
