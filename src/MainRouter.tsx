// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Route, Switch, Redirect, RouteProps } from "react-router";
import { useCredentials } from "./credentials";
import LoadingIndicator from "./widgets/LoadingIndicator";
import SyncGate from "./SyncGate";
import { routeResolver } from "./App";
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";


export default function MainRouter() {
  return (
    <Switch>
      <Route
        path={routeResolver.getRoute("signup")}
        exact
      >
        <SignupPage />
      </Route>
      <Route
        path={routeResolver.getRoute("login")}
        exact
      >
        <LoginPage />
      </Route>
      <PrivateRoute
        path="*"
      >
        <SyncGate />
      </PrivateRoute>
    </Switch>
  );
}

function PrivateRoute(props: Omit<RouteProps, "render">) {
  const credentials = useCredentials();
  const { children, ...rest } = props;

  if (credentials === undefined) {
    return (<LoadingIndicator style={{ display: "block", margin: "40px auto" }} />);
  }

  return (
    <Route
      {...rest}
      render={({ location }) => (
        (credentials) ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location },
            }}
          />
        )
      )}
    />
  );
}
