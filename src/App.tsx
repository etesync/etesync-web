import * as React from 'react';
import { connect } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { amber500, amber700, lightBlue500, darkBlack, white } from 'material-ui/styles/colors';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import IconButton from 'material-ui/IconButton';

import NavigationMenu from 'material-ui/svg-icons/navigation/menu';

import './App.css';

import SideMenu from './SideMenu';
import Root from './Root';
import { RouteResolver } from './routes';

import * as C from './Constants';
import * as store from './store';

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: amber500,
    primary2Color: amber700,
    accent1Color: lightBlue500,
    textColor: darkBlack,
    alternateTextColor: white,
  }
});

export function getPalette(part: string): string {
  const theme = muiTheme;
  if ((theme.palette === undefined) || (theme.palette[part] === undefined)) {
    return '';
  }

  return theme.palette[part];
}

export const routeResolver = new RouteResolver({
  home: '',
  journals: {
    _base: 'journals',
    _id: {
      _base: ':journalUid',
      items: {
        _base: 'items',
        _id: {
          _base: ':itemUid',
        },
      },
      entries: {
        _base: 'entries',
        _id: {
          _base: ':entryUid',
        },
      },
    },
  },
});

class App extends React.Component {
  state: {
    drawerOpen: boolean,
  };

  props: {
    credentials?: store.CredentialsType;
  };

  constructor(props: any) {
    super(props);
    this.state = { drawerOpen: false };

    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.closeDrawer = this.closeDrawer.bind(this);
  }

  toggleDrawer() {
    this.setState({drawerOpen: !this.state.drawerOpen});
  }

  closeDrawer() {
    this.setState({drawerOpen: false});
  }

  render() {
    const credentials = (this.props.credentials) ? this.props.credentials.value : null;

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <HashRouter>
        <div>
          <AppBar
            title={C.appName}
            iconElementLeft={<IconButton onClick={this.toggleDrawer}><NavigationMenu /></IconButton>}
          />
          <Drawer
            docked={false}
            width={250}
            open={this.state.drawerOpen}
            onRequestChange={this.toggleDrawer}
          >
            <SideMenu etesync={credentials} onCloseDrawerRequest={this.closeDrawer} />
          </Drawer>

          <Root />
        </div>
        </HashRouter>
      </MuiThemeProvider>
    );
  }
}

const mapStateToProps = (state: store.StoreState) => {
  return {
    credentials: state.credentials,
  };
};

export default connect(
  mapStateToProps
)(App);
