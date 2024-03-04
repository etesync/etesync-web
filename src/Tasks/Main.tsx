// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Switch, Route, useHistory } from "react-router";

import * as Etebase from "etebase";

import { Button, useTheme } from "@material-ui/core";
import IconEdit from "@material-ui/icons/Edit";
import IconChangeHistory from "@material-ui/icons/ChangeHistory";

import { TaskType, PimType, PimChanges } from "../pim-types";
import { useCredentials } from "../credentials";
import { useItems, useCollections } from "../etebase-helpers";
import { routeResolver } from "../App";
import TaskList from "./TaskList";
import Task from "./Task";
import LoadingIndicator from "../widgets/LoadingIndicator";
import TaskEdit from "./TaskEdit";
import PageNotFound, { PageNotFoundRoute } from "../PageNotFound";

import { CachedCollection, getItemNavigationUid, getDecryptCollectionsFunction, getDecryptItemsFunction, PimFab, itemSave, itemDelete } from "../Pim/helpers";
import ItemChangeHistory from "../Pim/ItemChangeHistory";

const colType = "etebase.vtodo";

const decryptCollections = getDecryptCollectionsFunction(colType);
const decryptItems = getDecryptItemsFunction(colType, TaskType.parse);

export default function TasksMain() {
  const [entries, setEntries] = React.useState<Map<string, Map<string, TaskType>>>();
  const [cachedCollections, setCachedCollections] = React.useState<CachedCollection[]>();
  const theme = useTheme();
  const history = useHistory();
  const etebase = useCredentials()!;
  const collections = useCollections(etebase, colType);
  const items = useItems(etebase, colType);

  React.useEffect(() => {
    if (!collections || !items) {
      return;
    }
    (async () => {
      const colEntries = await decryptCollections(collections);
      const entries = await decryptItems(items);

      setCachedCollections(colEntries);
      setEntries(entries);
    })();
  }, [items, collections]);

  if (!entries || !cachedCollections) {
    return (
      <LoadingIndicator />
    );
  }

  async function onItemSave(item: PimType, collectionUid: string, originalItem?: PimType): Promise<void> {
    await onMultipleItemsSave([{
      original: originalItem,
      new: item,
    }], collectionUid);
  }

  async function onMultipleItemsSave(changes: PimChanges[], collectionUid: string): Promise<void> {
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    await itemSave(etebase, collection, items!, collectionUid, changes);
  }

  function onCancel() {
    history.goBack();
  }

  const flatEntries: TaskType[] = [];
  for (const col of entries.values()) {
    for (const item of col.values()) {
      flatEntries.push(item);
    }
  }

  async function onItemDelete(item: PimType, collectionUid: string, redirect = true, recursive = false) {
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    if (recursive) {
      let index = 0;
      const deleteTarget = [item];
      while (index < deleteTarget.length) {
        const current = deleteTarget[index++];
        const children = flatEntries.filter((i) => i.relatedTo === current.uid);
        deleteTarget.push(...children);
      }
      await itemDelete(etebase, collection, items!, deleteTarget, collectionUid);
    } else {
      await itemDelete(etebase, collection, items!, [item], collectionUid);
    }
    if (redirect) {
      history.push(routeResolver.getRoute("pim.tasks"));
    }
  }

  const styles = {
    button: {
      marginLeft: theme.spacing(1),
    },
    leftIcon: {
      marginRight: theme.spacing(1),
    },
  };

  return (
    <Switch>
      <Route
        path={routeResolver.getRoute("pim.tasks")}
        exact
      >
        <TaskList
          entries={flatEntries}
          collections={cachedCollections}
          onItemClick={(item: TaskType) => history.push(
            routeResolver.getRoute("pim.tasks._id", { itemUid: getItemNavigationUid(item) })
          )}
          onItemSave={onItemSave}
        />
        <PimFab
          onClick={() => history.push(
            routeResolver.getRoute("pim.tasks.new")
          )}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("pim.tasks.new")}
        exact
      >
        <TaskEdit
          directChildren={[]}
          entries={flatEntries}
          collections={cachedCollections}
          onSave={onMultipleItemsSave}
          onDelete={onItemDelete}
          onCancel={onCancel}
          history={history}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("pim.tasks._id.log")}
        render={({ match }) => {
          // We have this path outside because we don't want the item existing check
          const [colUid, itemUid] = match.params.itemUid.split("|");
          const cachedCollection = cachedCollections!.find((x) => x.collection.uid === colUid)!;
          if (!cachedCollection) {
            return (<PageNotFound />);
          }

          return (
            <ItemChangeHistory collection={cachedCollection} itemUid={itemUid} />
          );
        }}
      />
      <Route
        path={routeResolver.getRoute("pim.tasks._id")}
        render={({ match }) => {
          const [colUid, itemUid] = match.params.itemUid.split("|");
          const item = entries.get(colUid)?.get(itemUid);
          if (!item) {
            return (<PageNotFound />);
          }

          const collection = collections!.find((x) => x.uid === colUid)!;
          const readOnly = collection.accessLevel === Etebase.CollectionAccessLevel.ReadOnly;

          return (
            <Switch>
              <Route
                path={routeResolver.getRoute("pim.tasks._id.edit")}
                exact
              >
                <TaskEdit
                  directChildren={flatEntries.filter((t) => t.relatedTo === item.uid)}
                  entries={flatEntries}
                  key={itemUid}
                  initialCollection={item.collectionUid}
                  item={item}
                  collections={cachedCollections}
                  onSave={onMultipleItemsSave}
                  onDelete={onItemDelete}
                  onCancel={onCancel}
                  history={history}
                />
              </Route>
              <Route
                path={routeResolver.getRoute("pim.tasks._id")}
                exact
              >
                <div style={{ textAlign: "right", marginBottom: 15 }}>
                  <Button
                    variant="contained"
                    style={styles.button}
                    onClick={() =>
                      history.push(routeResolver.getRoute("pim.tasks._id.log", { itemUid: getItemNavigationUid(item) }))
                    }
                  >
                    <IconChangeHistory style={styles.leftIcon} />
                    Change History
                  </Button>

                  <Button
                    color="secondary"
                    variant="contained"
                    disabled={readOnly}
                    style={{ ...styles.button, marginLeft: 15 }}
                    onClick={() =>
                      history.push(routeResolver.getRoute("pim.tasks._id.edit", { itemUid: getItemNavigationUid(item) }))
                    }
                  >
                    <IconEdit style={styles.leftIcon} />
                    Edit
                  </Button>

                </div>
                <Task item={item} />
              </Route>
              <PageNotFoundRoute />
            </Switch>
          );
        }}
      />
      <PageNotFoundRoute />
    </Switch>
  );
}

