// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import { List as ImmutableList } from 'immutable';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { MuiThemeProvider as ThemeProvider, createMuiTheme } from '@material-ui/core/styles'; // v1.x
import amber from '@material-ui/core/colors/amber';
import lightBlue from '@material-ui/core/colors/lightBlue';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import Badge from '@material-ui/core/Badge';

import NavigationMenu from '@material-ui/icons/Menu';
import NavigationBack from '@material-ui/icons/ArrowBack';
import NavigationRefresh from '@material-ui/icons/Refresh';
import ErrorsIcon from '@material-ui/icons/Error';

import 'react-virtualized/styles.css'; // only needs to be imported once

import './App.css';

import ConfirmationDialog from './widgets/ConfirmationDialog';
import PrettyError from './widgets/PrettyError';
import { List, ListItem } from './widgets/List';
import withSpin from './widgets/withSpin';
import ErrorBoundary from './components/ErrorBoundary';
import SideMenu from './SideMenu';
import LoginGate from './LoginGate';
import { RouteResolver } from './routes';

import * as store from './store';
import * as actions from './store/actions';

import { credentialsSelector } from './login';

import { History } from 'history';

const muiTheme = createMuiTheme({
  palette: {
    primary: amber,
    secondary: {
      light: lightBlue.A200,
      main: lightBlue.A400,
      dark: lightBlue.A700,
      contrastText: 'white',
    },
  },
});

export const routeResolver = new RouteResolver({
  home: '',
  pim: {
    contacts: {
      _id: {
        _base: ':itemUid',
        edit: 'edit',
        log: 'log',
      },
      new: 'new',
    },
    events: {
      _id: {
        _base: ':itemUid',
        edit: 'edit',
        log: 'log',
      },
      new: 'new',
    },
    tasks: {
      _id: {
        _base: ':itemUid',
        edit: 'edit',
        log: 'log',
      },
      new: 'new',
    },
  },
  journals: {
    _id: {
      _base: ':journalUid',
      edit: 'edit',
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
      members: {
      },
    },
    new: 'new',
    import: 'import',
  },
  settings: {
  },
  debug: {
  },
});

const AppBarWitHistory = withRouter(
  class extends React.PureComponent {
    public props: {
      title: string;
      toggleDrawerIcon: any;
      history?: History;
      staticContext?: any;
      iconElementRight: any;
    };

    constructor(props: any) {
      super(props);
      this.goBack = this.goBack.bind(this);
      this.canGoBack = this.canGoBack.bind(this);
    }

    public render() {
      const {
        staticContext,
        toggleDrawerIcon,
        history,
        iconElementRight,
        ...props
      } = this.props;
      return (
        <AppBar
          position="static"
          {...props}
        >
          <Toolbar>
            <div style={{ marginLeft: -12, marginRight: 20 }}>
              {!this.canGoBack() ?
                toggleDrawerIcon :
                <IconButton onClick={this.goBack}><NavigationBack /></IconButton>
              }
            </div>

            <div style={{ flexGrow: 1, fontSize: '1.25em' }} id="appbar-title" />

            <div style={{ marginRight: -12 }} id="appbar-buttons">
              {iconElementRight}
            </div>
          </Toolbar>
        </AppBar>
      );
    }

    private canGoBack() {
      return (
        (this.props.history!.length > 1) &&
        (this.props.history!.location.pathname !== routeResolver.getRoute('pim')) &&
        (this.props.history!.location.pathname !== routeResolver.getRoute('home'))
      );
    }

    private goBack() {
      this.props.history!.goBack();
    }
  }
);

const IconRefreshWithSpin = withSpin(NavigationRefresh);

class App extends React.PureComponent {
  public state: {
    drawerOpen: boolean;
    errorsDialog: boolean;
  };

  public props: {
    credentials: store.CredentialsData;
    entries: store.EntriesData;
    fetchCount: number;
    errors: ImmutableList<Error>;
  };

  constructor(props: any) {
    super(props);
    this.state = { drawerOpen: false, errorsDialog: false };

    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.closeDrawer = this.closeDrawer.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  public render() {
    const credentials = this.props.credentials ?? null;

    const errors = this.props.errors;
    const fetching = this.props.fetchCount > 0;

    const styles = {
      main: {
        backgroundColor: muiTheme.palette.background.default,
        color: muiTheme.palette.text.primary,
        flexGrow: 1,
      },
    };

    return (
      <ThemeProvider theme={muiTheme}>
        <BrowserRouter>
          <div style={styles.main}>
            <AppBarWitHistory
              toggleDrawerIcon={<IconButton onClick={this.toggleDrawer}><NavigationMenu /></IconButton>}
              iconElementRight={
                <>
                  {(errors.size > 0) && (
                    <IconButton onClick={() => this.setState({ errorsDialog: true })} title="Parse Errors">
                      <Badge badgeContent={errors.size} color="error">
                        <ErrorsIcon />
                      </Badge>
                    </IconButton>
                  )}
                  <IconButton disabled={!credentials || fetching} onClick={this.refresh} title="Refresh">
                    <IconRefreshWithSpin spin={fetching} />
                  </IconButton>
                </>
              }
            />
            <ConfirmationDialog
              title="Parse Errors"
              open={this.state.errorsDialog}
              labelOk="OK"
              onCancel={() => this.setState({ errorsDialog: false })}
              onOk={() => this.setState({ errorsDialog: false })}
            >
              <h4>
                This should not happen, please contact developers!
              </h4>
              <List>
                {errors.map((error, index) => (
                  <ListItem
                    key={index}
                    style={{ height: 'unset' }}
                    onClick={() => (window as any).navigator.clipboard.writeText(`${error.message}\n\n${error.stack}`)}
                  >
                    <PrettyError error={error} />
                  </ListItem>
                ))}
              </List>
            </ConfirmationDialog>

            <Drawer
              open={this.state.drawerOpen}
              onClose={this.toggleDrawer}
            >
              <SideMenu etesync={credentials} onCloseDrawerRequest={this.closeDrawer} />
            </Drawer>

            <ErrorBoundary>
              <LoginGate />
            </ErrorBoundary>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    );
  }

  private toggleDrawer() {
    this.setState({ drawerOpen: !this.state.drawerOpen });
  }

  private closeDrawer() {
    this.setState({ drawerOpen: false });
  }

  private refresh() {
    store.store.dispatch<any>(actions.fetchAll(this.props.credentials, this.props.entries));
  }
}

const mapStateToProps = (state: store.StoreState) => {
  return {
    credentials: credentialsSelector(state),
    entries: state.cache.entries,
    fetchCount: state.fetchCount,
    errors: state.errors,
  };
};

export default connect(
  mapStateToProps
)(App);
