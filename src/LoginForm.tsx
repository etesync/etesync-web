import * as React from 'react';
const Fragment = (React as any).Fragment;
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';

import { getPalette } from './App';

import * as C from './Constants';

interface FormErrors {
  errorEmail?: string;
  errorPassword?: string;
  errorEncryptionPassword?: string;
  errorServer?: string;
}

class LoginForm extends React.Component {
  state: {
    showAdvanced?: boolean;
    errors: FormErrors;

    server: string;
    username: string;
    password: string;
    encryptionPassword: string;
  };

  props: {
    onSubmit: (username: string, password: string, encryptionPassword: string, serviceApiUrl: string) => void;
    loading?: boolean;
    error?: Error;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      errors: {},
      server: '',
      username: '',
      password: '',
      encryptionPassword: '',
    };
    this.generateEncryption = this.generateEncryption.bind(this);
    this.toggleAdvancedSettings = this.toggleAdvancedSettings.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event: any) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({
      [name]: value
    });
  }

  generateEncryption(e: any) {
    e.preventDefault();
    const server = this.state.showAdvanced ? this.state.server : C.serviceApiBase;

    const username = this.state.username;
    const password = this.state.password;
    const encryptionPassword = this.state.encryptionPassword;

    let errors: FormErrors = {};
    const fieldRequired = 'This field is required!';
    if (!username) {
      errors.errorEmail = fieldRequired;
    }
    if (!password) {
      errors.errorPassword = fieldRequired;
    }
    if (!encryptionPassword) {
      errors.errorEncryptionPassword = fieldRequired;
    }
    if (Object.keys(errors).length) {
      this.setState({errors: errors});
      return;
    }

    this.props.onSubmit(username, password, encryptionPassword, server);
  }

  toggleAdvancedSettings() {
    this.setState({showAdvanced: !this.state.showAdvanced});
  }

  render() {
    let advancedSettings = null;
    if (this.state.showAdvanced) {
      advancedSettings = (
          <Fragment>
            <TextField
              type="url"
              errorText={this.state.errors.errorServer}
              floatingLabelText="Server"
              name="server"
              value={this.state.server}
              onChange={this.handleInputChange}
            />
            <br />
          </Fragment>
      );
    }

    const styles = {
      form: {
      },
      forgotPassword: {
        color: getPalette('accent1Color'),
        paddingTop: 20,
      },
      advancedSettings: {
        marginTop: 20,
      },
      submit: {
        marginTop: 40,
        textAlign: 'right',
      },
    };

    return (
      <Fragment>
        {(this.props.error) && (<div>Error! {this.props.error.message}</div>)}
        <h2>Please Log In</h2>
        <form style={styles.form} onSubmit={this.generateEncryption}>
          <TextField
            type="email"
            errorText={this.state.errors.errorEmail}
            floatingLabelText="Email"
            name="username"
            value={this.state.username}
            onChange={this.handleInputChange}
          />
          <TextField
            type="password"
            errorText={this.state.errors.errorPassword}
            floatingLabelText="Password"
            name="password"
            value={this.state.password}
            onChange={this.handleInputChange}
          />
          <div style={styles.forgotPassword}>
            <a href={C.forgotPassword}>Forgot password?</a>
          </div>
          <TextField
            type="password"
            errorText={this.state.errors.errorEncryptionPassword}
            floatingLabelText="Encryption Password"
            name="encryptionPassword"
            value={this.state.encryptionPassword}
            onChange={this.handleInputChange}
          />
          <Toggle
            label="Advanced settings"
            style={styles.advancedSettings}
            toggled={this.state.showAdvanced}
            onToggle={this.toggleAdvancedSettings}
          />
          {advancedSettings}

          <div style={styles.submit}>
            <RaisedButton
              type="submit"
              label={this.props.loading ? 'Loading…' : 'Log In'}
              secondary={true}
              disabled={this.props.loading}
            />
          </div>
        </form>
      </Fragment>
    );
  }
}

export default LoginForm;
