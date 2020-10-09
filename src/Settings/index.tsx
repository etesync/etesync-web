// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import * as Etebase from "etebase";
import { useSelector, useDispatch } from "react-redux";

import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Switch from "@material-ui/core/Switch";
import InputLabel from "@material-ui/core/InputLabel";

import { StoreState } from "../store";
import { setSettings, login, pushMessage } from "../store/actions";

import Container from "../widgets/Container";
import AppBarOverride from "../widgets/AppBarOverride";
import PrettyFingerprint from "../widgets/PrettyFingerprint";
import { useCredentials } from "../credentials";
import { Button } from "@material-ui/core";
import ConfirmationDialog from "../widgets/ConfirmationDialog";
import PasswordField from "../widgets/PasswordField";
import Alert from "@material-ui/lab/Alert";
import { PASSWORD_MIN_LENGTH, startTask, enforcePasswordRules } from "../helpers";

function SecurityFingerprint() {
  const etebase = useCredentials()!;
  const inviteMgr = etebase.getInvitationManager();
  const publicKey = inviteMgr.pubkey;

  return (
    <>
      <p>
        Your security fingerprint is:
      </p>
      <PrettyFingerprint publicKey={publicKey} />
    </>
  );
}

interface ChangePasswordFormErrors {
  oldPassword?: string;
  newPassword?: string;

  general?: string;
}

function ChangePassword() {
  const etebase = useCredentials()!;
  const dispatch = useDispatch();
  const [showDialog, setShowDialog] = React.useState(false);
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [errors, setErrors] = React.useState<ChangePasswordFormErrors>({});

  const styles = {
    infoAlert: {
      marginTop: 20,
    },
    textField: {
      marginTop: 20,
      width: "18em",
    },
  };

  function handleInputChange(func: (value: string) => void) {
    return (event: React.ChangeEvent<any>) => {
      func(event.target.value);
    };
  }

  async function onChangePassword() {
    try {
      const fieldNotEmpty = "Password can't be empty.";
      const errors: ChangePasswordFormErrors = {};
      if (!oldPassword) {
        errors.oldPassword = fieldNotEmpty;
      }
      if (!newPassword) {
        errors.newPassword = fieldNotEmpty;
      } else {
        const passwordRulesError = enforcePasswordRules(newPassword);
        if (passwordRulesError) {
          errors.newPassword = passwordRulesError;
        }
      }

      setErrors(errors);
      if (Object.keys(errors).length > 0) {
        return;
      }

      await startTask(async () => {
        const serverUrl = etebase.serverUrl;
        const username = etebase.user.username;
        try {
          const etebase = await Etebase.Account.login(username, oldPassword, serverUrl);
          await etebase.logout();
        } catch (e) {
          if (e instanceof Etebase.UnauthorizedError) {
            setErrors({ oldPassword: "Error: wrong encryption password." });
          } else {
            setErrors({ oldPassword: e.toString() });
          }
          return;
        }

        try {
          await etebase.changePassword(newPassword);
          dispatch(login(etebase));
          dispatch(pushMessage({ message: "Password successfully changed.", severity: "success" }));
          setShowDialog(false);
        } catch (e) {
          setErrors({ newPassword: e.toString() });
        }
      });
    } finally {
      // Cleanup
    }
  }

  return (
    <>
      <p>
        Change your password by clicking here;
      </p>
      <Button color="secondary" variant="contained" onClick={() => setShowDialog(true)}>
        Change Password
      </Button>
      <ConfirmationDialog
        title="Change Password"
        key={showDialog}
        open={showDialog}
        onOk={onChangePassword}
        onCancel={() => setShowDialog(false)}
      >
        <PasswordField
          style={styles.textField}
          error={!!errors.oldPassword}
          helperText={errors.oldPassword}
          label="Current Password"
          value={oldPassword}
          onChange={handleInputChange(setOldPassword)}
        />
        <PasswordField
          style={styles.textField}
          error={!!errors.newPassword}
          helperText={errors.newPassword}
          label="New Password"
          inputProps={{
            minLength: PASSWORD_MIN_LENGTH,
          }}
          value={newPassword}
          onChange={handleInputChange(setNewPassword)}
        />
        {errors.general && (
          <Alert severity="error" style={styles.infoAlert}>{errors.general}</Alert>
        )}

        <Alert severity="warning" style={styles.infoAlert}>
          Please make sure you remember your password, as it <em>can't</em> be recovered if lost!
        </Alert>
      </ConfirmationDialog>
    </>
  );
}

export default React.memo(function Settings() {
  const etebase = useCredentials();
  const dispatch = useDispatch();
  const settings = useSelector((state: StoreState) => state.settings);

  const darkMode = !!settings.darkMode;

  function handleChange(event: React.ChangeEvent<any>) {
    const name = event.target.name;
    const value = event.target.value;

    dispatch(setSettings({ ...settings, [name]: value }));
  }

  return (
    <>
      <AppBarOverride title="Settings" />
      <Container>
        {(etebase) && (
          <>
            <h1>Account</h1>
            <h2>Security Fingerprint</h2>
            <SecurityFingerprint />

            <h2>Account Dashboard</h2>
            <p>
              Change your payment info, plan and other account settings
            </p>
            <Button color="secondary" variant="contained" onClick={async () => {
              try {
                const url = await etebase!.getDashboardUrl();
                window.open(url, "_blank", "noopener,noreferrer");
              } catch (e) {
                dispatch(pushMessage({ message: e.message, severity: "error" }));
              }
            }}>
              Open Dashboard
            </Button>

            <h2>Password</h2>
            <ChangePassword />
          </>
        )}

        <h1>Look & Feel</h1>
        <h2>Date & Time</h2>
        <FormControl style={{ width: "15em" }}>
          <InputLabel>
            Locale
          </InputLabel>
          <Select
            name="locale"
            value={settings.locale}
            onChange={handleChange}
          >
            <MenuItem value="en-gb">English (United Kingdom)</MenuItem>
            <MenuItem value="en-us">English (United States)</MenuItem>
          </Select>
        </FormControl>
        <h2>Dark mode</h2>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                color="primary"
                checked={darkMode}
                onChange={() => dispatch(setSettings({ ...settings, darkMode: !darkMode }))}
              />
            }
            label="Dark mode"
          />
        </FormGroup>
      </Container>
    </>
  );
});
