// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Switch, Route, useHistory } from "react-router";

import { useCredentials } from "../credentials";
import { useCollections } from "../etebase-helpers";
import { routeResolver } from "../App";
import LoadingIndicator from "../widgets/LoadingIndicator";

import { CachedCollection, getDecryptCollectionsFunction, PimFab } from "../Pim/helpers";
import CollectionList from "./CollectionList";

const decryptCollections = getDecryptCollectionsFunction();

export default function CollectionsMain() {
  const [cachedCollections, setCachedCollections] = React.useState<CachedCollection[]>();
  const history = useHistory();
  const etebase = useCredentials()!;
  const collections = useCollections(etebase);

  React.useEffect(() => {
    if (collections) {
      decryptCollections(collections)
        .then((entries) => setCachedCollections(entries));
      // FIXME: handle failure to decrypt collections
    }
  }, [collections]);

  if (!cachedCollections) {
    return (
      <LoadingIndicator />
    );
  }

  return (
    <Switch>
      <Route
        path={routeResolver.getRoute("collections")}
        exact
      >
        <CollectionList collections={cachedCollections} />
        <PimFab
          onClick={() => history.push(
            routeResolver.getRoute("collections.new")
          )}
        />
      </Route>
    </Switch>
  );
}

