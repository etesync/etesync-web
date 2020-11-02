// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import * as colors from "@material-ui/core/colors";

import IconDelete from "@material-ui/icons/Delete";
import IconCancel from "@material-ui/icons/Clear";
import IconSave from "@material-ui/icons/Save";

import ConfirmationDialog from "../widgets/ConfirmationDialog";

import { CachedCollection } from "../Pim/helpers";

import * as uuid from "uuid";
import * as ICAL from "ical.js";

import { ContactType } from "../pim-types";

import { History } from "history";

class ValueType {
  public type: string;
  public value: string;

  constructor(type?: string, value?: string) {
    this.type = type ? type : "home";
    this.value = value ? value : "";
  }
}

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

class GroupEdit extends React.PureComponent<PropsType> {
  public state: {
    uid: string;
    fn: string;
    collectionUid: string;
    showDeleteDialog: boolean;
    collectionGroups: {};
    showError: boolean;
  };

  constructor(props: PropsType) {
    super(props);
    this.state = {
      uid: "",
      fn: "",
      collectionUid: "",
      showDeleteDialog: false,
      collectionGroups: {},
      showError: false,
    };

    if (this.props.item !== undefined) {
      const group = this.props.item;
      this.state.uid = group.uid;
      this.state.fn = group.fn;
    } else {
      this.state.uid = uuid.v4();
    }

    if (props.initialCollection) {
      this.state.collectionUid = props.initialCollection;
    } else if (props.collections[0]) {
      this.state.collectionUid = props.collections[0].collection.uid;
    }

    this.state.collectionGroups = this.getCollectionGroups(this.state.collectionUid);

    this.onSubmit = this.onSubmit.bind(this);
    this.getCollectionGroups = this.getCollectionGroups.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCollectionChange = this.handleCollectionChange.bind(this);
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

  public getCollectionGroups(collectionUid: string) {
    const groups = {};
    this.props.allGroups.forEach((group) => {
      if (collectionUid === group.collectionUid) {
        groups[group.fn] = null;
      }
    });
    return groups;
  }

  public handleCollectionChange(contact: any) {
    const name = contact.target.name;
    const collectionUid: string = contact.target.value;
    this.handleChange(name, collectionUid);
    this.setState({ "collectionGroups": this.getCollectionGroups(collectionUid) });
  }

  public handleInputChange(contact: any) {
    const name = contact.target.name;
    const value = contact.target.value;
    this.handleChange(name, value);
  }

  public onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    const nameUsed = this.state.fn in this.state.collectionGroups;
    if ((this.props.item && this.state.fn !== this.props.item.fn && nameUsed) || (!this.props.item && nameUsed)) {
      this.setState({ showError: true });
      return;
    }

    const group = (this.props.item) ?
      this.props.item.clone()
      :
      new ContactType(new ICAL.Component(["vcard", [], []]))
      ;

    const comp = group.comp;
    comp.updatePropertyWithValue("prodid", "-//iCal.js EteSync Web");
    comp.updatePropertyWithValue("version", "4.0");
    comp.updatePropertyWithValue("uid", this.state.uid);
    comp.updatePropertyWithValue("rev", ICAL.Time.now());
    comp.updatePropertyWithValue("kind", "group");
    comp.updatePropertyWithValue("fn", this.state.fn.trim());

    this.props.onSave(group, this.state.collectionUid, this.props.item)
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
          {this.props.item ? "Edit Group" : "New Group"}
        </h2>
        <form style={styles.form} onSubmit={this.onSubmit}>
          <FormControl disabled={this.props.item !== undefined} style={styles.fullWidth}>
            <InputLabel>
              Saving to
            </InputLabel>
            <Select
              name="collectionUid"
              value={this.state.collectionUid}
              onChange={this.handleCollectionChange}
            >
              {this.props.collections.map((x) => (
                <MenuItem key={x.collection.uid} value={x.collection.uid}>{x.metadata.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="fn"
            placeholder="Name"
            error={this.state.showError}
            helperText="Group names must be unique"
            style={{ marginTop: "2rem", ...styles.fullWidth }}
            value={this.state.fn}
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
              disabled={this.state.fn.length === 0}
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
          Are you sure you would like to delete this group?
        </ConfirmationDialog>
      </React.Fragment>
    );
  }
}

export default GroupEdit;
