// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

interface FormErrors {
  errorEncryptionPassword?: string;
}

class EncryptionLoginForm extends React.PureComponent {
  public state: {
    errors: FormErrors;
    encryptionPassword: string;
  };

  public props: {
    onSubmit: (encryptionPassword: string) => void;
    loading?: boolean;
    error?: Error;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      errors: {},
      encryptionPassword: "",
    };
    this.generateEncryption = this.generateEncryption.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  public handleInputChange(event: React.ChangeEvent<any>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({
      [name]: value,
    });
  }

  public generateEncryption(e: any) {
    e.preventDefault();

    const encryptionPassword = this.state.encryptionPassword;

    const errors: FormErrors = {};
    const fieldRequired = "This field is required!";
    if (!encryptionPassword) {
      errors.errorEncryptionPassword = fieldRequired;
    }

    if (Object.keys(errors).length) {
      this.setState({ errors });
      return;
    } else {
      this.setState({ errors: {} });
    }

    this.props.onSubmit(encryptionPassword);
  }

  public render() {
    const styles = {
      form: {
      },
      submit: {
        marginTop: 40,
        textAlign: "right" as any,
      },
    };

    return (
      <React.Fragment>
        {(this.props.error) && (<div>Error! {this.props.error.message}</div>)}
        <form style={styles.form} onSubmit={this.generateEncryption}>
          <TextField
            type="password"
            autoFocus
            error={!!this.state.errors.errorEncryptionPassword}
            helperText={this.state.errors.errorEncryptionPassword}
            label="Encryption Password"
            name="encryptionPassword"
            value={this.state.encryptionPassword}
            onChange={this.handleInputChange}
          />

          <div style={styles.submit}>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={this.props.loading}
            >
              {this.props.loading ? "Loading…" : "Continue"}
            </Button>
          </div>
        </form>
      </React.Fragment>
    );
  }
}

export default EncryptionLoginForm;
