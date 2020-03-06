// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import ExternalLink from '../widgets/ExternalLink';

import * as C from '../constants';

interface FormErrors {
  errorEmail?: string;
  errorPassword?: string;
  errorEncryptionPassword?: string;
  errorServer?: string;
}

class LoginForm extends React.PureComponent {
  public state: {
    showAdvanced: boolean;
    errors: FormErrors;

    server: string;
    username: string;
    password: string;
  };

  public props: {
    onSubmit: (username: string, password: string, serviceApiUrl?: string) => void;
    loading?: boolean;
    error?: Error;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      showAdvanced: false,
      errors: {},
      server: '',
      username: '',
      password: '',
    };
    this.generateEncryption = this.generateEncryption.bind(this);
    this.toggleAdvancedSettings = this.toggleAdvancedSettings.bind(this);
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
    const server = this.state.showAdvanced ? this.state.server : undefined;

    const username = this.state.username;
    const password = this.state.password;

    const errors: FormErrors = {};
    const fieldRequired = 'This field is required!';
    if (!username) {
      errors.errorEmail = fieldRequired;
    }
    if (!password) {
      errors.errorPassword = fieldRequired;
    }

    if (process.env.NODE_ENV !== 'development') {
      if (this.state.showAdvanced && !this.state.server.startsWith('https://')) {
        errors.errorServer = 'Server URI must start with https://';
      }
    }

    if (Object.keys(errors).length) {
      this.setState({ errors });
      return;
    } else {
      this.setState({ errors: {} });
    }

    this.props.onSubmit(username, password, server);
  }

  public toggleAdvancedSettings() {
    this.setState({ showAdvanced: !this.state.showAdvanced });
  }

  public render() {
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
        textAlign: 'right' as any,
      },
    };

    let advancedSettings = null;
    if (this.state.showAdvanced) {
      advancedSettings = (
        <React.Fragment>
          <TextField
            type="url"
            style={styles.textField}
            error={!!this.state.errors.errorServer}
            helperText={this.state.errors.errorServer}
            label="Server"
            name="server"
            value={this.state.server}
            onChange={this.handleInputChange}
          />
          <br />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        {(this.props.error) && (<div>Error! {this.props.error.message}</div>)}
        <form style={styles.form} onSubmit={this.generateEncryption}>
          <TextField
            type={this.state.showAdvanced ? 'text' : 'email'}
            style={styles.textField}
            error={!!this.state.errors.errorEmail}
            helperText={this.state.errors.errorEmail}
            label="Email"
            name="username"
            value={this.state.username}
            onChange={this.handleInputChange}
          />
          <br />
          <TextField
            type="password"
            style={styles.textField}
            error={!!this.state.errors.errorPassword}
            helperText={this.state.errors.errorPassword}
            label="Password"
            name="password"
            value={this.state.password}
            onChange={this.handleInputChange}
          />
          <div style={styles.forgotPassword}>
            <ExternalLink href={C.forgotPassword}>Forgot password?</ExternalLink>
          </div>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  checked={this.state.showAdvanced}
                  onChange={this.toggleAdvancedSettings}
                />
              }
              label="Advanced settings"
            />
          </FormGroup>
          {advancedSettings}

          <div style={styles.submit}>
            <Button
              variant="contained"
              type="submit"
              color="secondary"
              disabled={this.props.loading}
            >
              {this.props.loading ? 'Loading…' : 'Log In'}
            </Button>
          </div>
        </form>
      </React.Fragment>
    );
  }
}

export default LoginForm;
