import * as React from 'react';
import { connect } from 'react-redux';
import { History } from 'history';

import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';

import { store, StoreState, SettingsType } from '../store';
import { setSettings } from '../store/actions';

import Container from '../widgets/Container';
import AppBarOverride from '../widgets/AppBarOverride';

interface PropsType {
  history: History;
}

interface PropsTypeInner extends PropsType {
  settings: SettingsType;
}

class Settings extends React.PureComponent<PropsTypeInner> {
  constructor(props: any) {
    super(props);
    this.onCancel = this.onCancel.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  public render() {
    const { settings } = this.props;
    return (
      <>
        <AppBarOverride title="Settings" />
        <Container>
          <h1>Date & Time</h1>
          <FormControl style={{ width: '15em' }}>
            <InputLabel>
              Locale
            </InputLabel>
            <Select
              name="locale"
              value={settings.locale}
              onChange={this.handleChange}
            >
              <MenuItem value="en-gb">English (United Kingdom)</MenuItem>
              <MenuItem value="en-us">English (United States)</MenuItem>
            </Select>
          </FormControl>
        </Container>
      </>
    );
  }

  public onCancel() {
    this.props.history.goBack();
  }

  private handleChange(event: React.ChangeEvent<any>) {
    const name = event.target.name;
    const value = event.target.value;

    const { settings } = this.props;
    store.dispatch(setSettings({ ...settings, [name]: value }));
  }
}

const mapStateToProps = (state: StoreState, _props: PropsType) => {
  return {
    settings: state.settings,
  };
};

export default connect(
  mapStateToProps
)(Settings);
