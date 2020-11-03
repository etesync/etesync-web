// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import IconDelete from "@material-ui/icons/Delete";
import IconCancel from "@material-ui/icons/Clear";
import IconSave from "@material-ui/icons/Save";
import * as colors from "@material-ui/core/colors";

import AppBarOverride from "../widgets/AppBarOverride";
import Container from "../widgets/Container";
import ConfirmationDialog from "../widgets/ConfirmationDialog";

import * as Etebase from "etebase";

import ColorPicker from "../widgets/ColorPicker";
import { defaultColor } from "../Pim/helpers";
import { CachedCollection } from "../Pim/helpers";
import { useCredentials } from "../credentials";
import { getCollectionManager } from "../etebase-helpers";

interface PropsType {
  collection?: CachedCollection;
  onSave: (collection: Etebase.Collection) => void;
  onDelete: (collection: Etebase.Collection) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  color?: string;
}

export default function CollectionEdit(props: PropsType) {
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [colType, setColType] = React.useState("");
  const [info, setInfo] = React.useState<Etebase.ItemMetadata>();
  const [selectedColor, setSelectedColor] = React.useState("");
  const etebase = useCredentials()!;

  React.useEffect(() => {
    if (props.collection !== undefined) {
      setColType(props.collection.collectionType);
      setInfo(props.collection.metadata);
      if (props.collection.metadata.color) {
        setSelectedColor(props.collection.metadata.color);
      }
    } else {
      setColType("etebase.vcard");
      setInfo({
        name: "",
        description: "",
      });
    }
  }, [props.collection]);

  if (info === undefined) {
    return <React.Fragment />;
  }

  async function onSubmit(e: React.FormEvent<any>) {
    e.preventDefault();
    const saveErrors: FormErrors = {};
    const fieldRequired = "This field is required!";

    const { onSave } = props;

    if (!info) {
      throw new Error("Got undefined info. Should never happen.");
    }

    const name = info.name;
    const color = selectedColor;

    if (!name) {
      saveErrors.name = fieldRequired;
    }

    if (color && !/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color)) {
      saveErrors.color = "Must be of the form #RRGGBB or #RRGGBBAA or empty";
    }

    setErrors(saveErrors);
    if (Object.keys(saveErrors).length > 0) {
      return;
    }

    const colMgr = getCollectionManager(etebase);
    const mtime = (new Date()).getTime();
    const meta = { ...info, color, mtime };
    let collection;
    if (props.collection) {
      collection = props.collection.collection;
      collection.setMeta(meta);
    } else {
      collection = await colMgr.create(colType, meta, "");
    }

    onSave(collection);
  }

  function onDeleteRequest() {
    setShowDeleteDialog(true);
  }

  const { collection, onDelete, onCancel } = props;
  const item = collection?.metadata;

  const pageTitle = (item !== undefined) ? item.name! : "New Collection";

  const styles = {
    fullWidth: {
      width: "100%",
    },
    submit: {
      marginTop: 40,
      marginBottom: 20,
      textAlign: "right" as any,
    },
  };

  const colTypes = {
    "etebase.vcard": "Address Book",
    "etebase.vevent": "Calendar",
    "etebase.vtodo": "Task List",
  };
  let collectionColorBox: React.ReactNode;
  switch (colType) {
    case "etebase.vevent":
    case "etebase.vtodo":
      collectionColorBox = (
        <ColorPicker
          defaultColor={defaultColor}
          color={selectedColor}
          onChange={(color: string) => setSelectedColor(color)}
          error={errors.color}
        />
      );
      break;
  }

  return (
    <>
      <AppBarOverride title={pageTitle} />
      <Container style={{ maxWidth: "30rem" }}>
        <form onSubmit={onSubmit}>
          <FormControl disabled={props.collection !== undefined} style={styles.fullWidth}>
            <InputLabel>
              Collection type
            </InputLabel>
            <Select
              name="type"
              required
              value={colType}
              onChange={(event: React.ChangeEvent<{ value: string }>) => setColType(event.target.value)}
            >
              {Object.keys(colTypes).map((x) => (
                <MenuItem key={x} value={x}>{colTypes[x]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="name"
            required
            label="Name of this collection"
            value={info.name}
            onChange={(event: React.ChangeEvent<{ value: string }>) => setInfo({ ...info, name: event.target.value })}
            style={styles.fullWidth}
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            name="description"
            label="Description (optional)"
            value={info.description}
            onChange={(event: React.ChangeEvent<{ value: string }>) => setInfo({ ...info, description: event.target.value })}
            style={styles.fullWidth}
            margin="normal"
          />
          {collectionColorBox}

          <div style={styles.submit}>
            <Button
              variant="contained"
              onClick={onCancel}
            >
              <IconCancel style={{ marginRight: 8 }} />
              Cancel
            </Button>

            {props.collection &&
              <Button
                variant="contained"
                style={{ marginLeft: 15, backgroundColor: colors.red[500], color: "white" }}
                onClick={onDeleteRequest}
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
      </Container>
      <ConfirmationDialog
        title="Delete Confirmation"
        labelOk="Delete"
        open={showDeleteDialog}
        onOk={() => onDelete(props.collection?.collection!)}
        onCancel={() => setShowDeleteDialog(false)}
      >
        Are you sure you would like to delete this collection?
      </ConfirmationDialog>
    </>
  );
}
