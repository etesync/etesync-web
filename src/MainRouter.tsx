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
import WizardPage from "./WizardPage";
import { Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { useSelector, useDispatch } from "react-redux";
import { StoreState } from "./store";
import { popMessage } from "./store/actions";


export default function MainRouter() {
  return (
    <>
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
          path={routeResolver.getRoute("wizard")}
          exact
        >
          <WizardPage />
        </PrivateRoute>
        <PrivateRoute
          path="*"
        >
          <SyncGate />
        </PrivateRoute>
      </Switch>
      <GlobalMessages />
    </>
  );
}

function GlobalMessages() {
  const dispatch = useDispatch();
  const message = useSelector((state: StoreState) => state.messages.first(undefined));

  function handleClose() {
    dispatch(popMessage());
  }

  return (
    <Snackbar
      key={message?.message}
      open={!!message}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={handleClose} severity={message?.severity}>
        {message?.message}
      </Alert>
    </Snackbar>
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
