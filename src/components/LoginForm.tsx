// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

import ExternalLink from "../widgets/ExternalLink";
import PasswordField from "../widgets/PasswordField";

import * as C from "../constants";
import LoadingIndicator from "../widgets/LoadingIndicator";
import Alert from "@material-ui/lab/Alert";

interface FormErrors {
  errorEmail?: string;
  errorPassword?: string;
  errorEncryptionPassword?: string;
  errorServer?: string;
}

interface PropsType {
  onSubmit: (username: string, password: string, serviceApiUrl?: string) => void;
  loading?: boolean;
  error?: Error;
}

export default function LoginForm(props: PropsType) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [server, setServer] = React.useState("");
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});

  function generateEncryption(e: React.FormEvent<any>) {
    e.preventDefault();
    const errors: FormErrors = {};
    const fieldRequired = "This field is required!";
    if (!username) {
      errors.errorEmail = fieldRequired;
    } else if (username.includes("@")) {
      errors.errorEmail = "Please use your username (not email)";
    }
    if (!password) {
      errors.errorPassword = fieldRequired;
    }

    if (process.env.NODE_ENV !== "development") {
      if (showAdvanced && !server.startsWith("https://")) {
        errors.errorServer = "Server URI must start with https://";
      }
    }

    if (Object.keys(errors).length) {
      setErrors(errors);
      return;
    } else {
      setErrors({});
    }

    props.onSubmit(username, password, (showAdvanced) ? server : undefined);
  }

  const styles = {
    form: {
    },
    forgotPassword: {
      paddingTop: 20,
    },
    infoAlert: {
      marginTop: 20,
    },
    textField: {
      marginTop: 20,
      width: "18em",
    },
    submit: {
      marginTop: 40,
      textAlign: "right" as any,
    },
  };

  function handleInputChange(func: (value: string) => void) {
    return (event: React.ChangeEvent<any>) => {
      func(event.target.value);
    };
  }

  let advancedSettings = null;
  if (showAdvanced) {
    advancedSettings = (
      <React.Fragment>
        <TextField
          type="url"
          style={styles.textField}
          error={!!errors.errorServer}
          helperText={errors.errorServer}
          label="Server"
          value={server}
          onChange={handleInputChange(setServer)}
        />
        <br />
      </React.Fragment>
    );
  }

  if (props.loading) {
    return (
      <div style={{ textAlign: "center" }}>
        <LoadingIndicator />
        <p>Deriving encryption data...</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      <form style={styles.form} onSubmit={generateEncryption}>
        <TextField
          type="text"
          style={styles.textField}
          error={!!errors.errorEmail}
          helperText={errors.errorEmail}
          label="Username"
          value={username}
          onChange={handleInputChange(setUsername)}
        />
        <br />
        <PasswordField
          style={styles.textField}
          error={!!errors.errorPassword}
          helperText={errors.errorPassword}
          label="Password"
          name="password"
          value={password}
          onChange={handleInputChange(setPassword)}
        />
        <div style={styles.forgotPassword}>
          <ExternalLink href={C.forgotPassword}>Forgot password?</ExternalLink>
        </div>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                color="primary"
                checked={showAdvanced}
                onChange={() => setShowAdvanced(!showAdvanced)}
              />
            }
            label="Advanced settings"
          />
        </FormGroup>
        {advancedSettings}

        {props.error && (
          <Alert severity="error" style={styles.infoAlert}>{props.error.message}</Alert>
        )}

        <div style={styles.submit}>
          <Button
            variant="contained"
            type="submit"
            color="secondary"
            disabled={props.loading}
          >
            {props.loading ? "Loading…" : "Log In"}
          </Button>
        </div>
      </form>
    </React.Fragment>
  );
}
