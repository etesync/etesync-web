// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import { useDispatch } from "react-redux";

import Container from "./widgets/Container";
import ExternalLink from "./widgets/ExternalLink";
import SyncGate from "./SyncGate";
import LoginForm from "./components/LoginForm";

import { login } from "./store/actions";

import * as C from "./constants";

import SignedPagesBadge from "./images/signed-pages-badge.svg";
import { useCredentials } from "./credentials";
import LoadingIndicator from "./widgets/LoadingIndicator";


export default function LoginGate() {
  const credentials = useCredentials();
  const dispatch = useDispatch();
  const [fetchError, setFetchError] = React.useState<Error>();

  async function onFormSubmit(username: string, password: string, serviceApiUrl?: string) {
    try {
      setFetchError(undefined);
      const ret = login(username, password, serviceApiUrl);
      await ret.payload;
      dispatch(ret);
    } catch (e) {
      setFetchError(e);
    }
  }

  if (credentials === undefined) {
    return (
      <LoadingIndicator />
    );
  } else if (credentials === null) {
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
        <h2>Please Log In</h2>
        <LoginForm
          onSubmit={onFormSubmit}
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

  return (
    <SyncGate />
  );
}
