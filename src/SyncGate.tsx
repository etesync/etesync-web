// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Route, Switch, Redirect, withRouter, useHistory } from "react-router";

import moment from "moment";
import "moment/locale/en-gb";

import { List, Map } from "immutable";

import { routeResolver } from "./App";

import AppBarOverride from "./widgets/AppBarOverride";
import LoadingIndicator from "./widgets/LoadingIndicator";

import Journals from "./Journals";
import Settings from "./Settings";
import Debug from "./Debug";
import Pim from "./Pim";

import * as EteSync from "etesync";

import { SyncManager } from "./sync/SyncManager";

import { StoreState } from "./store";
import { performSync } from "./store/actions";
import { useCredentials } from "./credentials";

export interface SyncInfoJournal {
  journal: EteSync.Journal;
  journalEntries: List<EteSync.Entry>;
  collection: EteSync.CollectionInfo;
  entries: List<EteSync.SyncEntry>;
}

export type SyncInfo = Map<string, SyncInfoJournal>;

const PimRouter = withRouter(Pim);

export default function SyncGate() {
  const etebase = useCredentials();
  const settings = useSelector((state: StoreState) => state.settings);
  const userInfo = useSelector((state: StoreState) => state.cache.userInfo);
  const journals = useSelector((state: StoreState) => state.cache.journals);
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

  const etesync = etebase as any;

  return (
    <Switch>
      <Route
        path={routeResolver.getRoute("home")}
        exact
        render={() => (
          <Redirect to={routeResolver.getRoute("pim")} />
        )}
      />
      {false && (
        <>
          <Route
            path={routeResolver.getRoute("pim")}
            render={({ history }) => (
              <>
                <AppBarOverride title="EteSync" />
                <PimRouter
                  etesync={etesync}
                  userInfo={userInfo}
                  syncInfo={false as any}
                  history={history}
                />
              </>
            )}
          />
          <Route
            path={routeResolver.getRoute("journals")}
            render={({ location, history }) => (
              <Journals
                etesync={etesync}
                userInfo={userInfo}
                syncInfo={false as any}
                journals={journals}
                location={location}
                history={history}
              />
            )}
          />
        </>
      )}
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
          <Debug
            etesync={etesync}
            userInfo={userInfo}
          />
        )}
      />
    </Switch>
  );
}
