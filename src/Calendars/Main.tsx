// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Switch, Route, useHistory } from "react-router";

import * as Etebase from "etebase";

import { Button, useTheme } from "@material-ui/core";
import IconEdit from "@material-ui/icons/Edit";
import IconDuplicate from "@material-ui/icons/FileCopy";
import IconChangeHistory from "@material-ui/icons/ChangeHistory";

import { EventType, PimType } from "../pim-types";
import { useCredentials } from "../credentials";
import { useItems, useCollections } from "../etebase-helpers";
import { routeResolver } from "../App";
import Calendar from "./Calendar";
import Event from "./Event";
import LoadingIndicator from "../widgets/LoadingIndicator";
import EventEdit from "./EventEdit";
import PageNotFound, { PageNotFoundRoute } from "../PageNotFound";

import { CachedCollection, getItemNavigationUid, getDecryptCollectionsFunction, getDecryptItemsFunction, PimFab, itemDelete, itemSave, defaultColor } from "../Pim/helpers";
import { historyPersistor } from "../persist-state-history";
import ItemChangeHistory from "../Pim/ItemChangeHistory";

const PersistCalendar = historyPersistor("Calendar")(Calendar);

const colType = "etebase.vevent";

const decryptCollections = getDecryptCollectionsFunction(colType);
const decryptItems = getDecryptItemsFunction(colType, EventType.parse);

export default function CalendarsMain() {
  const [entries, setEntries] = React.useState<Map<string, Map<string, EventType>>>();
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

      for (const collection of colEntries) {
        const items = entries.get(collection.collection.uid)!;
        for (const item of items.values()) {
          item.color = collection.metadata.color || defaultColor;
        }
      }

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
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    await itemSave(etebase, collection, items!, collectionUid,
      [{
        original: originalItem,
        new: item,
      }]
    );
  }

  async function onItemDelete(item: PimType, collectionUid: string) {
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    await itemDelete(etebase, collection, items!, [item], collectionUid);

    history.push(routeResolver.getRoute("pim.events"));
  }

  function onCancel() {
    history.goBack();
  }

  const flatEntries = [];
  for (const col of entries.values()) {
    for (const item of col.values()) {
      flatEntries.push(item);
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
        path={routeResolver.getRoute("pim.events")}
        exact
      >
        <PersistCalendar
          entries={flatEntries}
          onItemClick={(item: EventType) => history.push(
            routeResolver.getRoute("pim.events._id", { itemUid: getItemNavigationUid(item) })
          )}
          onSlotClick={(start?: Date, end?: Date) => history.push(
            routeResolver.getRoute("pim.events.new"),
            { start, end }
          )}
        />
        <PimFab
          onClick={() => history.push(
            routeResolver.getRoute("pim.events.new")
          )}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("pim.events.new")}
        exact
      >
        <EventEdit
          collections={cachedCollections}
          onSave={onItemSave}
          onDelete={onItemDelete}
          onCancel={onCancel}
          history={history}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("pim.events._id.log")}
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
        path={routeResolver.getRoute("pim.events._id")}
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
                path={routeResolver.getRoute("pim.events._id.edit")}
                exact
              >
                <EventEdit
                  key={itemUid}
                  initialCollection={item.collectionUid}
                  item={item}
                  collections={cachedCollections}
                  onSave={onItemSave}
                  onDelete={onItemDelete}
                  onCancel={onCancel}
                  history={history}
                />
              </Route>
              <Route
                path={routeResolver.getRoute("pim.events._id.duplicate")}
                exact
              >
                <EventEdit
                  key={itemUid}
                  initialCollection={item.collectionUid}
                  item={item}
                  collections={cachedCollections}
                  onSave={onItemSave}
                  onDelete={onItemDelete}
                  onCancel={onCancel}
                  history={history}
                  duplicate
                />
              </Route>
              <Route
                path={routeResolver.getRoute("pim.events._id")}
                exact
              >
                <div style={{ textAlign: "right", marginBottom: 15 }}>
                  <Button
                    variant="contained"
                    style={styles.button}
                    onClick={() =>
                      history.push(routeResolver.getRoute("pim.events._id.log", { itemUid: getItemNavigationUid(item) }))
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
                      history.push(routeResolver.getRoute("pim.events._id.edit", { itemUid: getItemNavigationUid(item) }))
                    }
                  >
                    <IconEdit style={styles.leftIcon} />
                    Edit
                  </Button>

                  <Button
                    color="secondary"
                    variant="contained"
                    disabled={readOnly}
                    style={{ ...styles.button, marginLeft: 15 }}
                    onClick={() =>
                      history.push(routeResolver.getRoute("pim.events._id.duplicate", { itemUid: getItemNavigationUid(item) }))
                    }
                  >
                    <IconDuplicate style={styles.leftIcon} />
                    Duplicate
                  </Button>

                </div>
                <Event item={item} />
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

