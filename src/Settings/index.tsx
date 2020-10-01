// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { useSelector, useDispatch } from "react-redux";

import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Switch from "@material-ui/core/Switch";
import InputLabel from "@material-ui/core/InputLabel";

import { StoreState } from "../store";
import { setSettings } from "../store/actions";

import Container from "../widgets/Container";
import AppBarOverride from "../widgets/AppBarOverride";
import PrettyFingerprint from "../widgets/PrettyFingerprint";
import { useCredentials } from "../credentials";

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

export default React.memo(function Settings() {
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
        <h1>Security Fingerprint</h1>
        <SecurityFingerprint />

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
