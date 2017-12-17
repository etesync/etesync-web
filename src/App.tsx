import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { amber500, amber700, lightBlue500, darkBlack, white } from 'material-ui/styles/colors';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import IconButton from 'material-ui/IconButton';

import NavigationMenu from 'material-ui/svg-icons/navigation/menu';
import NavigationBack from 'material-ui/svg-icons/navigation/arrow-back';

import './App.css';

import SideMenu from './SideMenu';
import LoginGate from './LoginGate';
import { RouteResolver } from './routes';

import * as C from './constants';
import * as store from './store';

import { History } from 'history';

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
  pim: {
    contacts: {
      _id: {
        _base: ':contactUid',
        edit: 'edit',
      },
      new: 'new',
    },
    events: {
      _id: {
        _base: ':eventUid',
        edit: 'edit',
      },
      new: 'new',
    },
  },
  journals: {
    _id: {
      _base: ':journalUid',
      items: {
        _id: {
          _base: ':itemUid',
        },
      },
      entries: {
        _id: {
          _base: ':entryUid',
        },
      },
    },
  },
});

const AppBarWitHistory = withRouter(
  class extends React.PureComponent {
    props: {
      title: string,
      toggleDrawerIcon: any,
      history?: History;
      staticContext?: any;
    };

    constructor(props: any) {
      super(props);
      this.goBack = this.goBack.bind(this);
      this.canGoBack = this.canGoBack.bind(this);
    }

    canGoBack() {
      return this.props.history!.location.pathname !== routeResolver.getRoute('pim');
    }

    goBack() {
      this.props.history!.goBack();
    }

    render() {
      const {
        staticContext,
        toggleDrawerIcon,
        history,
        ...props
      } = this.props;
      return (
        <AppBar
          iconElementLeft={!this.canGoBack() ?
            toggleDrawerIcon :
            <IconButton onClick={this.goBack}><NavigationBack /></IconButton>
          }
          {...props}
        />
      );
    }
  }
);

class App extends React.PureComponent {
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
        <BrowserRouter>
        <div>
          <AppBarWitHistory
            title={C.appName}
            toggleDrawerIcon={<IconButton onClick={this.toggleDrawer}><NavigationMenu /></IconButton>}

          />
          <Drawer
            docked={false}
            width={250}
            open={this.state.drawerOpen}
            onRequestChange={this.toggleDrawer}
          >
            <SideMenu etesync={credentials} onCloseDrawerRequest={this.closeDrawer} />
          </Drawer>

          <LoginGate />
        </div>
        </BrowserRouter>
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
