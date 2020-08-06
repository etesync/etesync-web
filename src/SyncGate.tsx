// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Route, Switch, Redirect, useHistory } from "react-router";

import moment from "moment";
import "moment/locale/en-gb";

import { routeResolver } from "./App";

import AppBarOverride from "./widgets/AppBarOverride";
import LoadingIndicator from "./widgets/LoadingIndicator";
import Container from "./widgets/Container";
import ContactsMain from "./Contacts/Main";
import CalendarsMain from "./Calendars/Main";
import TasksMain from "./Tasks/Main";
import CollectionsMain from "./Collections/Main";

import Settings from "./Settings";
import Debug from "./Debug";

import { SyncManager } from "./sync/SyncManager";

import { StoreState } from "./store";
import { performSync } from "./store/actions";
import { useCredentials } from "./credentials";
import PimNavigationTabs from "./Pim/NavigationTabs";

export default function SyncGate() {
  const etebase = useCredentials();
  const settings = useSelector((state: StoreState) => state.settings);
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(true);

  // Doing this so we refresh on route changes
  useHistory();

  React.useEffect(() => {
    (async () => {
      const syncManager = SyncManager.getManager(etebase!);
      const sync = syncManager.sync();
      dispatch(performSync(sync));
      await sync;
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (<LoadingIndicator style={{ display: "block", margin: "40px auto" }} />);
  }

  // FIXME: Shouldn't be here
  moment.locale(settings.locale);

  return (
    <Switch>
      <Route
        path={routeResolver.getRoute("home")}
        exact
        render={() => (
          <Redirect to={routeResolver.getRoute("pim")} />
        )}
      />
      <Route
        path={routeResolver.getRoute("pim")}
      >
        <AppBarOverride title="EteSync" />
        <Switch>
          <Route
            path={routeResolver.getRoute("pim")}
            exact
          >
            <Redirect to={routeResolver.getRoute("pim.events")} />
          </Route>
          <Route
            path={routeResolver.getRoute("pim.contacts")}
          >
            <PimNavigationTabs value="contacts" />
            <Container>
              <ContactsMain />
            </Container>
          </Route>
          <Route
            path={routeResolver.getRoute("pim.events")}
          >
            <PimNavigationTabs value="events" />
            <Container>
              <CalendarsMain />
            </Container>
          </Route>
          <Route
            path={routeResolver.getRoute("pim.tasks")}
          >
            <PimNavigationTabs value="tasks" />
            <Container>
              <TasksMain />
            </Container>
          </Route>
        </Switch>
      </Route>
      <Route
        path={routeResolver.getRoute("collections")}
      >
        <CollectionsMain />
      </Route>
      <Route
        path={routeResolver.getRoute("settings")}
        exact
        render={() => (
          <Settings />
        )}
      />
      <Route
        path={routeResolver.getRoute("debug")}
        exact
        render={() => (
          <Debug />
        )}
      />
    </Switch>
  );
}
