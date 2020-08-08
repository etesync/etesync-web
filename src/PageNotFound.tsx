// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Route } from "react-router";

import Container from "./widgets/Container";

export function PageNotFoundRoute(props: { container?: boolean }) {
  return (
    <Route path="*">
      {props.container ? (
        <Container>
          <PageNotFound />
        </Container>
      ) : (
        <PageNotFound />
      )}
    </Route>
  );
}

export default function PageNotFound() {
  return (
    <h1>404 Page Not Found</h1>
  );
}
