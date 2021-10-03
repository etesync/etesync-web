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

import Container from "./widgets/Container";
import PasswordField from "./widgets/PasswordField";

import LoadingIndicator from "./widgets/LoadingIndicator";
import Alert from "@material-ui/lab/Alert";
import { CircularProgress } from "@material-ui/core";
import { Redirect } from "react-router";
import { useCredentials } from "./credentials";
import { useDispatch } from "react-redux";
import { startTask, PASSWORD_MIN_LENGTH, enforcePasswordRules } from "./helpers";
import { login } from "./store/actions";
import { Link } from "react-router-dom";

import * as C from "./constants";
import ExternalLink from "./widgets/ExternalLink";

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  server?: string;

  general?: string;
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
      <Redirect to={routeResolver.getRoute("wizard")} />
    );
  }

  async function signup(e: React.FormEvent<any>) {
    e.preventDefault();
    setLoading(true);
    try {
      const errors: FormErrors = {};
      const fieldRequired = "This field is required!";
      if (!username) {
        errors.username = fieldRequired;
      }
      if (!email) {
        errors.email = fieldRequired;
      }
      if (!password) {
        errors.password = fieldRequired;
      } else {
        const passwordRulesError = enforcePasswordRules(password);
        if (passwordRulesError) {
          errors.password = passwordRulesError;
        }
      }

      if (process.env.NODE_ENV !== "development") {
        if (showAdvanced && !server.startsWith("https://")) {
          errors.server = "Server URI must start with https://";
        }
      }

      if (Object.keys(errors).length) {
        setErrors(errors);
        return;
      } else {
        setErrors({});
      }

      const serverUrl = (showAdvanced) ? server : C.defaultServerUrl;
      const user: Etebase.User = {
        username,
        email,
      };
      const etebase = await startTask((async () => {
        return await Etebase.Account.signup(user, password, serverUrl);
      }));
      dispatch(login(etebase));
    } catch (e) {
      if ((e instanceof Etebase.HttpError) && (e.content)) {
        let found = false;
        if (e.content.errors) {
          for (const field of e.content.errors) {
            if (field.field === "user.username") {
              errors.username = field.detail;
              found = true;
            } else if (field.field === "user.email") {
              errors.email = field.detail;
              found = true;
            } else if (!field.field) {
              errors.general = field.detail;
              found = true;
            }
          }
        }

        if (!found) {
          errors.general = e.content.detail ?? e.toString();
        }
      } else {
        errors.general = e.toString();
      }
      setErrors(errors);
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    form: {
    },
    infoAlert: {
      marginTop: 20,
    },
    textField: {
      marginTop: 20,
      width: "18em",
    },
    submit: {
      marginTop: 20,
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
          error={!!errors.server}
          helperText={errors.server}
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
      <h2 style={{ marginBottom: "0.1em" }}>Signup</h2>
      <div style={{ fontSize: "90%" }}>or <Link to={routeResolver.getRoute("home")}>log in to your account</Link></div>

      <Alert
        style={styles.infoAlert}
        severity="info"
      >
        <a href={C.pricing} style={{ color: "inherit", textDecoration: "inherit", display: "block" }}>
          You are signing up for a free trial. Click here for pricing information.
        </a>
      </Alert>


      <form style={styles.form} onSubmit={signup}>
        <TextField
          type="text"
          style={styles.textField}
          error={!!errors.username}
          helperText={errors.username}
          label="Username"
          value={username}
          onChange={handleInputChange(setUsername)}
        />
        <br />
        <TextField
          type="email"
          style={styles.textField}
          error={!!errors.email}
          helperText={errors.email}
          label="Email"
          value={email}
          onChange={handleInputChange(setEmail)}
        />
        <br />
        <PasswordField
          style={styles.textField}
          error={!!errors.password}
          helperText={errors.password}
          label="Password"
          name="password"
          inputProps={{
            minLength: PASSWORD_MIN_LENGTH,
          }}
          value={password}
          onChange={handleInputChange(setPassword)}
        />

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
        {errors.general && (
          <Alert severity="error" style={styles.infoAlert}>{errors.general}</Alert>
        )}

        <Alert severity="warning" style={styles.infoAlert}>
          Please make sure you remember your password, as it <em>can't</em> be recovered if lost!
        </Alert>

        <p style={styles.infoAlert}>
          By signing up you agree to our <ExternalLink href={C.terms}>terms of service</ExternalLink>.
        </p>

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
