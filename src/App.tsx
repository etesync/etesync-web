// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { RouteResolver } from "./routes";

import * as store from "./store";
import * as actions from "./store/actions";

import { useCredentials } from "./credentials";
import { SyncManager } from "./sync/SyncManager";
import MainRouter from "./MainRouter";

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
  collections: {
    _id: {
      _base: ":colUid",
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
  login: {
  },
  signup: {
  },
  settings: {
  },
  debug: {
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

export default function App() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [errorsDialog, setErrorsDialog] = React.useState(false);
  const dispatch = useDispatch();
  const etebase = useCredentials();
  const darkMode = useSelector((state: store.StoreState) => state.settings.darkMode);
  const fetchCount = useSelector((state: store.StoreState) => state.fetchCount);
  const errors = useSelector((state: store.StoreState) => state.errors);

  async function refresh() {
    const syncManager = SyncManager.getManager(etebase!);
    const sync = syncManager.sync();
    dispatch(actions.performSync(sync));
    await sync;
  }

  function autoRefresh() {
    if (navigator.onLine && etebase) {
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

  const credentials = etebase ?? null;

  const fetching = fetchCount > 0;

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
            <MainRouter />
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
