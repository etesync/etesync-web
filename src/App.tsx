// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { List as ImmutableList } from "immutable";
import { connect, useDispatch } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { MuiThemeProvider as ThemeProvider, createMuiTheme } from "@material-ui/core/styles"; // v1.x
import amber from "@material-ui/core/colors/amber";
import lightBlue from "@material-ui/core/colors/lightBlue";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import Badge from "@material-ui/core/Badge";

import NavigationMenu from "@material-ui/icons/Menu";
import NavigationRefresh from "@material-ui/icons/Refresh";
import ErrorsIcon from "@material-ui/icons/Error";

import "react-virtualized/styles.css"; // only needs to be imported once

import "./App.css";

import ConfirmationDialog from "./widgets/ConfirmationDialog";
import PrettyError from "./widgets/PrettyError";
import { List, ListItem } from "./widgets/List";
import withSpin from "./widgets/withSpin";
import ErrorBoundary from "./components/ErrorBoundary";
import SideMenu from "./SideMenu";
import LoginGate from "./LoginGate";
import { RouteResolver } from "./routes";

import * as store from "./store";
import * as actions from "./store/actions";

import { credentialsSelector } from "./login";

export const routeResolver = new RouteResolver({
  home: "",
  pim: {
    contacts: {
      _id: {
        _base: ":itemUid",
        edit: "edit",
        log: "log",
      },
      new: "new",
    },
    events: {
      _id: {
        _base: ":itemUid",
        edit: "edit",
        duplicate: "duplicate",
        log: "log",
      },
      new: "new",
    },
    tasks: {
      _id: {
        _base: ":itemUid",
        edit: "edit",
        log: "log",
      },
      new: "new",
    },
  },
  journals: {
    _id: {
      _base: ":journalUid",
      edit: "edit",
      items: {
        _id: {
          _base: ":itemUid",
        },
      },
      entries: {
        _id: {
          _base: ":entryUid",
        },
      },
      members: {
      },
    },
    new: "new",
    import: "import",
  },
  settings: {
  },
  debug: {
  },
  "migrate-v2": {
  },
});

interface AppBarPropsType {
  toggleDrawerIcon: any;
  iconElementRight: any;
}

function AppBarWitHistory(props: AppBarPropsType) {
  const {
    toggleDrawerIcon,
    iconElementRight,
    ...rest
  } = props;
  return (
    <AppBar
      position="static"
      {...rest}
    >
      <Toolbar>
        <div style={{ marginLeft: -12, marginRight: 20 }}>
          {toggleDrawerIcon}
        </div>

        <div style={{ flexGrow: 1, fontSize: "1.25em" }} id="appbar-title" />

        <div style={{ marginRight: -12 }} id="appbar-buttons">
          {iconElementRight}
        </div>
      </Toolbar>
    </AppBar>
  );
}

const IconRefreshWithSpin = withSpin(NavigationRefresh);

interface PropsType {
  credentials: store.CredentialsData;
  entries: store.EntriesData;
  fetchCount: number;
  darkMode: boolean;
  errors: ImmutableList<Error>;
}

function App(props: PropsType) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [errorsDialog, setErrorsDialog] = React.useState(false);
  const dispatch = useDispatch();

  function refresh() {
    dispatch(actions.fetchAll(props.credentials, props.entries));
  }

  function autoRefresh() {
    if (navigator.onLine && props.credentials &&
      !(window.location.pathname.match(/.*\/(new|edit|duplicate)$/) || window.location.pathname.startsWith("/migrate-v2"))) {
      refresh();
    }
  }

  React.useEffect(() => {
    const interval = 60 * 1000;
    const id = setInterval(autoRefresh, interval);
    return () => clearInterval(id);
  });

  function toggleDrawer() {
    setDrawerOpen(!drawerOpen);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  const credentials = props.credentials ?? null;
  const { darkMode } = props;

  const errors = props.errors;
  const fetching = props.fetchCount > 0;

  const muiTheme = createMuiTheme({
    palette: {
      type: darkMode ? "dark" : undefined,
      primary: amber,
      secondary: {
        light: lightBlue.A200,
        main: lightBlue.A400,
        dark: lightBlue.A700,
        contrastText: "#fff",
      },
    },
  });

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
        <div style={styles.main} className={darkMode ? "theme-dark" : "theme-light"}>
          <AppBarWitHistory
            toggleDrawerIcon={<IconButton onClick={toggleDrawer}><NavigationMenu /></IconButton>}
            iconElementRight={
              <>
                {(errors.size > 0) && (
                  <IconButton onClick={() => setErrorsDialog(true)} title="Parse Errors">
                    <Badge badgeContent={errors.size} color="error">
                      <ErrorsIcon />
                    </Badge>
                  </IconButton>
                )}
                <IconButton disabled={!credentials || fetching} onClick={refresh} title="Refresh">
                  <IconRefreshWithSpin spin={fetching} />
                </IconButton>
              </>
            }
          />
          <ConfirmationDialog
            title="Parse Errors"
            open={errorsDialog}
            labelOk="OK"
            onCancel={() => setErrorsDialog(false)}
            onOk={() => setErrorsDialog(false)}
          >
            <h4>
              This should not happen, please contact developers!
            </h4>
            <List>
              {errors.map((error, index) => (
                <ListItem
                  key={index}
                  style={{ height: "unset" }}
                  onClick={() => (window as any).navigator.clipboard.writeText(`${error.message}\n\n${error.stack}`)}
                >
                  <PrettyError error={error} />
                </ListItem>
              ))}
            </List>
          </ConfirmationDialog>

          <Drawer
            open={drawerOpen}
            onClose={toggleDrawer}
          >
            <SideMenu onCloseDrawerRequest={closeDrawer} />
          </Drawer>

          <ErrorBoundary>
            <LoginGate />
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

const mapStateToProps = (state: store.StoreState) => {
  return {
    credentials: credentialsSelector(state),
    entries: state.cache.entries,
    fetchCount: state.fetchCount,
    darkMode: !!state.settings.darkMode,
    errors: state.errors,
  };
};

export default connect(
  mapStateToProps
)(App as any);
