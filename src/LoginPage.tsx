// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import { useDispatch } from "react-redux";

import Container from "./widgets/Container";
import ExternalLink from "./widgets/ExternalLink";
import LoginForm from "./components/LoginForm";

import { login } from "./store/actions";

import * as Etebase from "etebase";

import * as C from "./constants";

import SignedPagesBadge from "./images/signed-pages-badge.svg";
import { useCredentials } from "./credentials";
import LoadingIndicator from "./widgets/LoadingIndicator";
import { startTask } from "./helpers";
import { Redirect, useLocation } from "react-router";
import { routeResolver } from "./App";
import { Link } from "react-router-dom";

interface LocationState {
  from: {
    pathname: string;
  };
}

export default function LoginPage() {
  const credentials = useCredentials();
  const dispatch = useDispatch();
  const location = useLocation();
  const [loading, setLoading] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<Error>();

  const { from } = location.state as LocationState || { from: { pathname: routeResolver.getRoute("home") } };
  if (credentials) {
    return (
      <Redirect to={from.pathname} />
    );
  }

  async function onFormSubmit(username: string, password: string, serviceApiUrl?: string) {
    try {
      setLoading(true);
      setFetchError(undefined);
      const etebase = await startTask((async () => {
        return await Etebase.Account.login(username, password, serviceApiUrl);
      }));
      dispatch(login(etebase));
    } catch (e) {
      console.log(e);
      if ((e instanceof Etebase.HTTPError) && (e.status === 404)) {
        setFetchError(new Error("Etebase server not found: are you sure the server URL is correct?"));
      } else {
        setFetchError(e);
      }
    } finally {
      setLoading(false);
    }
  }

  if (credentials === undefined) {
    return (
      <LoadingIndicator />
    );
  } else {
    const style = {
      isSafe: {
        textDecoration: "none",
        display: "block",
      },
      divider: {
        margin: "30px 0",
        color: "#00000025",
      },
    };

    return (
      <Container style={{ maxWidth: "30rem" }}>
        <h2 style={{ marginBottom: "0.1em" }}>Log In</h2>
        <div style={{ fontSize: "90%" }}>or <Link to={routeResolver.getRoute("signup")}>create an account</Link></div>
        <LoginForm
          onSubmit={onFormSubmit}
          loading={loading}
          error={fetchError}
        />
        <hr style={style.divider} />
        <ExternalLink style={style.isSafe} href="https://www.etesync.com/faq/#signed-pages">
          <img alt="SignedPgaes badge" src={SignedPagesBadge} />
        </ExternalLink>
        <ul>
          <li><ExternalLink style={style.isSafe} href={C.homePage}>
            The EteSync Website
          </ExternalLink></li>
          <li><ExternalLink style={style.isSafe} href={C.faq + "#web-client"}>
            Is the web client safe to use?
          </ExternalLink></li>
          <li><ExternalLink style={style.isSafe} href={C.sourceCode}>Source code</ExternalLink></li>
        </ul>
      </Container>
    );
  }
}
