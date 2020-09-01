// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import * as Etebase from "etebase";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

import { routeResolver } from "./App";

import ExternalLink from "./widgets/ExternalLink";
import Container from "./widgets/Container";

import * as C from "./constants";
import LoadingIndicator from "./widgets/LoadingIndicator";
import Alert from "@material-ui/lab/Alert";
import { CircularProgress } from "@material-ui/core";
import { Redirect } from "react-router";
import { useCredentials } from "./credentials";
import { useDispatch } from "react-redux";
import { startTask } from "./helpers";
import { login } from "./store/actions";

interface FormErrors {
  errorUsername?: string;
  errorEmail?: string;
  errorPassword?: string;
  errorEncryptionPassword?: string;
  errorServer?: string;

  errorGeneral?: string;
}

export default function SignupPage() {
  const credentials = useCredentials();
  const dispatch = useDispatch();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [server, setServer] = React.useState("");
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});

  if (credentials) {
    return (
      <Redirect to={routeResolver.getRoute("home")} />
    );
  }

  async function signup(e: React.FormEvent<any>) {
    e.preventDefault();
    setLoading(true);
    try {
      const errors: FormErrors = {};
      const fieldRequired = "This field is required!";
      if (!username) {
        errors.errorUsername = fieldRequired;
      }
      if (!email) {
        errors.errorEmail = fieldRequired;
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

      const serverUrl = (showAdvanced) ? server : undefined;
      const user: Etebase.User = {
        username,
        email,
      };
      const etebase = await startTask((async () => {
        return await Etebase.Account.signup(user, password, serverUrl);
      }));
      dispatch(login(etebase));
    } catch (e) {
      errors.errorGeneral = e.toString();
      setErrors(errors);
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    form: {
    },
    forgotPassword: {
      paddingTop: 20,
    },
    textField: {
      marginTop: 20,
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

  if (loading) {
    return (
      <div style={{ textAlign: "center" }}>
        <LoadingIndicator />
        <p>Deriving encryption data...</p>
      </div>
    );
  }

  return (
    <Container style={{ maxWidth: "30rem" }}>
      <h2>Signup</h2>
      <form style={styles.form} onSubmit={signup}>
        <TextField
          type="text"
          style={styles.textField}
          error={!!errors.errorUsername}
          helperText={errors.errorUsername}
          label="Username"
          value={username}
          onChange={handleInputChange(setUsername)}
        />
        <br />
        <TextField
          type="email"
          style={styles.textField}
          error={!!errors.errorEmail}
          helperText={errors.errorEmail}
          label="Email"
          value={email}
          onChange={handleInputChange(setEmail)}
        />
        <br />
        <TextField
          type="password"
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
        {errors.errorGeneral && (
          <Alert severity="error" style={styles.textField}>{errors.errorGeneral}</Alert>
        )}

        <div style={styles.submit}>
          <Button
            variant="contained"
            type="submit"
            color="secondary"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress />
            ) : "Sign Up"
            }
          </Button>
        </div>
      </form>
    </Container>
  );
}
