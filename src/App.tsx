import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { createSelector } from 'reselect';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { amber500, amber700, lightBlue500, darkBlack, white } from 'material-ui/styles/colors';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import IconButton from 'material-ui/IconButton';

import NavigationMenu from 'material-ui/svg-icons/navigation/menu';
import NavigationBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationRefresh from 'material-ui/svg-icons/navigation/refresh';

import './App.css';

import withSpin from './widgets/withSpin';
import SideMenu from './SideMenu';
import LoginGate from './LoginGate';
import { RouteResolver } from './routes';

import * as C from './constants';
import * as store from './store';
import * as actions from './store/actions';

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
        log: 'log',
      },
      new: 'new',
    },
    events: {
      _id: {
        _base: ':eventUid',
        edit: 'edit',
        log: 'log',
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
      iconElementRight: any,
    };

    constructor(props: any) {
      super(props);
      this.goBack = this.goBack.bind(this);
      this.canGoBack = this.canGoBack.bind(this);
    }

    canGoBack() {
      return (
        (this.props.history!.length > 1) &&
        (this.props.history!.location.pathname !== routeResolver.getRoute('pim')) &&
        (this.props.history!.location.pathname !== routeResolver.getRoute('home'))
      );
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

const IconRefreshWithSpin = withSpin(NavigationRefresh);

class App extends React.PureComponent {
  state: {
    drawerOpen: boolean,
  };

  props: {
    credentials: store.CredentialsType;
    entries: store.EntriesType;
    fetchCount: number;
  };

  constructor(props: any) {
    super(props);
    this.state = { drawerOpen: false };

    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.closeDrawer = this.closeDrawer.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  toggleDrawer() {
    this.setState({drawerOpen: !this.state.drawerOpen});
  }

  closeDrawer() {
    this.setState({drawerOpen: false});
  }

  refresh() {
    store.store.dispatch(actions.fetchAll(this.props.credentials.value!, this.props.entries));
  }

  render() {
    const credentials = (this.props.credentials) ? this.props.credentials.value : null;

    const fetching = this.props.fetchCount > 0;

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <BrowserRouter>
        <div>
          <AppBarWitHistory
            title={C.appName}
            toggleDrawerIcon={<IconButton onClick={this.toggleDrawer}><NavigationMenu /></IconButton>}
            iconElementRight={
              <IconButton disabled={!credentials || fetching} onClick={this.refresh}>
                <IconRefreshWithSpin spin={fetching} />
              </IconButton>}

          />
          <Drawer
            docked={false}
            width={250}
            open={this.state.drawerOpen}
            onRequestChange={this.toggleDrawer}
          >
            <SideMenu etesync={credentials} onCloseDrawerRequest={this.closeDrawer} />
          </Drawer>

          <LoginGate credentials={this.props.credentials} />
        </div>
        </BrowserRouter>
      </MuiThemeProvider>
    );
  }
}

const credentialsSelector = createSelector(
  (state: store.StoreState) => state.credentials.value,
  (state: store.StoreState) => state.credentials.error,
  (state: store.StoreState) => state.credentials.fetching,
  (state: store.StoreState) => state.encryptionKey.key,
  (value, error, fetching, encryptionKey) => {
    if (value === null) {
      return {value, error, fetching};
    }

    return {
      error: error,
      fetching: fetching,
      value: {
        ...value,
        encryptionKey: encryptionKey,
      }
    };
  }
);

const mapStateToProps = (state: store.StoreState) => {
  return {
    credentials: credentialsSelector(state),
    entries: state.cache.entries,
    fetchCount: state.fetchCount,
  };
};

export default connect(
  mapStateToProps
)(App);
