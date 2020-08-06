// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import LoadingIndicator from "../widgets/LoadingIndicator";
import ConfirmationDialog from "../widgets/ConfirmationDialog";
import PrettyFingerprint from "../widgets/PrettyFingerprint";

import * as EteSync from "etesync";

import { CredentialsData } from "../store";

interface PropsType {
  etesync: CredentialsData;
  info: EteSync.CollectionInfo;
  onOk: (user: string, publicKey: string, readOnly: boolean) => void;
  onClose: () => void;
}

export default function JournalMemberAddDialog(props: PropsType) {
  const [addUser, setAddUser] = React.useState("");
  const [publicKey, setPublicKey] = React.useState("");
  const [readOnly, setReadOnly] = React.useState(false);
  const [userChosen, setUserChosen] = React.useState(false);
  const [error, setError] = React.useState<Error>();

  function onAddRequest(_user: string) {
    setUserChosen(true);

    const { etesync } = props;

    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const userInfoManager = new EteSync.UserInfoManager(creds, apiBase);
    userInfoManager.fetch(addUser).then((userInfo) => {
      setPublicKey(userInfo.publicKey);
    }).catch((error) => {
      setError(error);
    });
  }

  function onOk() {
    props.onOk(addUser, publicKey, readOnly);
  }

  const { onClose } = props;

  if (error) {
    return (
      <>
        <ConfirmationDialog
          title="Error adding member"
          labelOk="OK"
          open
          onOk={onClose}
          onCancel={onClose}
        >
          User ({addUser}) not found. Have they setup their encryption password from one of the apps?
        </ConfirmationDialog>
      </>
    );
  }

  if (publicKey) {
    return (
      <>
        <ConfirmationDialog
          title="Verify security fingerprint"
          labelOk="OK"
          open
          onOk={onOk}
          onCancel={onClose}
        >
          <p>
            Verify {addUser}'s security fingerprint to ensure the encryption is secure.
          </p>
          <div style={{ textAlign: "center" }}>
            <PrettyFingerprint publicKey={publicKey} />
          </div>
        </ConfirmationDialog>
      </>
    );
  } else {
    return (
      <>
        <ConfirmationDialog
          title="Add member"
          labelOk="OK"
          open={!userChosen}
          onOk={onAddRequest}
          onCancel={onClose}
        >
          {userChosen ?
            <LoadingIndicator />
            :
            <>
              <TextField
                name="addUser"
                type="email"
                placeholder="User email"
                style={{ width: "100%" }}
                value={addUser}
                onChange={(ev) => setAddUser(ev.target.value)}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={readOnly}
                    onChange={(event) => setReadOnly(event.target.checked)}
                  />
                }
                label="Read only?"
              />
            </>
          }
        </ConfirmationDialog>
      </>
    );
  }
}
