// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import * as Etebase from "etebase";

import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import LoadingIndicator from "../widgets/LoadingIndicator";
import ConfirmationDialog from "../widgets/ConfirmationDialog";
import PrettyFingerprint from "../widgets/PrettyFingerprint";
import { CachedCollection } from "../Pim/helpers";
import { useCredentials } from "../credentials";

interface PropsType {
  collection: CachedCollection;
  onOk: (username: string, publicKey: Uint8Array, accessLevel: Etebase.CollectionAccessLevel) => void;
  onClose: () => void;
}

export default function CollectionMemberAddDialog(props: PropsType) {
  const etebase = useCredentials()!;
  const [addUser, setAddUser] = React.useState("");
  const [publicKey, setPublicKey] = React.useState<Uint8Array>();
  const [readOnly, setReadOnly] = React.useState(false);
  const [userChosen, setUserChosen] = React.useState(false);
  const [error, setError] = React.useState<Error>();

  async function onAddRequest(_user: string) {
    setUserChosen(true);
    const inviteMgr = etebase.getInvitationManager();
    try {
      const userProfile = await inviteMgr.fetchUserProfile(addUser);
      setPublicKey(userProfile.pubkey);
    } catch (e) {
      setError(e);
    }
  }

  function onOk() {
    props.onOk(addUser, publicKey!, readOnly ? Etebase.CollectionAccessLevel.ReadOnly : Etebase.CollectionAccessLevel.ReadWrite);
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
          User ({addUser}) not found.
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
          title="Invite user"
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
                placeholder="Username"
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
