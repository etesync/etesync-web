// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Switch, Route, useHistory } from "react-router";

import * as Etebase from "etebase";

import { useCredentials } from "../credentials";
import { useCollections, getCollectionManager } from "../etebase-helpers";
import { routeResolver } from "../App";
import LoadingIndicator from "../widgets/LoadingIndicator";

import { CachedCollection, getDecryptCollectionsFunction, PimFab } from "../Pim/helpers";
import CollectionList from "./CollectionList";
import CollectionImport from "./CollectionImport";
import PageNotFound from "../PageNotFound";
import CollectionEdit from "./CollectionEdit";
import CollectionMembers from "./CollectionMembers";
import Collection from "./Collection";
import { useAsyncDispatch } from "../store";
import { collectionUpload } from "../store/actions";
import Invitations from "./Invitations";

const decryptCollections = getDecryptCollectionsFunction();

export default function CollectionsMain() {
  const [cachedCollections, setCachedCollections] = React.useState<CachedCollection[]>();
  const history = useHistory();
  const etebase = useCredentials()!;
  const collections = useCollections(etebase);
  const dispatch = useAsyncDispatch();

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

  async function onSave(collection: Etebase.Collection): Promise<void> {
    const colMgr = getCollectionManager(etebase);
    await dispatch(collectionUpload(colMgr, collection));

    history.push(routeResolver.getRoute("collections"));
  }

  async function onDelete(collection: Etebase.Collection) {
    const colMgr = getCollectionManager(etebase);
    const mtime = (new Date()).getTime();
    const meta = await collection.getMeta();
    await collection.setMeta({ ...meta, mtime });
    await collection.delete(true);
    await dispatch(collectionUpload(colMgr, collection));

    history.push(routeResolver.getRoute("collections"));
  }

  function onCancel() {
    history.goBack();
  }

  return (
    <Switch>
      <Route
        path={routeResolver.getRoute("collections")}
        exact
      >
        <CollectionList
          collections={cachedCollections}
        />
        <PimFab
          onClick={() => history.push(
            routeResolver.getRoute("collections.new")
          )}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("collections.import")}
        exact
      >
        <CollectionImport
          collections={cachedCollections}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("collections.new")}
        exact
      >
        <CollectionEdit
          onSave={onSave}
          onDelete={onDelete}
          onCancel={onCancel}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("collections.invitations")}
      >
        <Invitations />
      </Route>
      <Route
        path={routeResolver.getRoute("collections._id")}
        render={({ match }) => {
          const colUid = match.params.colUid;
          const collection = cachedCollections.find((x) => x.collection.uid === colUid);
          if (!collection) {
            return (<PageNotFound />);
          }

          return (
            <Switch>
              <Route
                path={routeResolver.getRoute("collections._id.edit")}
                exact
              >
                <CollectionEdit
                  collection={collection}
                  onSave={onSave}
                  onDelete={onDelete}
                  onCancel={onCancel}
                />
              </Route>
              <Route
                path={routeResolver.getRoute("collections._id.members")}
                exact
              >
                <CollectionMembers collection={collection} />
              </Route>
              <Route
                path={routeResolver.getRoute("collections._id")}
                exact
              >
                <Collection collection={collection} />
              </Route>
            </Switch>
          );
        }}
      />
    </Switch>
  );
}

