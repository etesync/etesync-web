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
import { useItems, useCollections, getCollectionManager } from "../etebase-helpers";
import { routeResolver } from "../App";
import Calendar from "./Calendar";
import Event from "./Event";
import LoadingIndicator from "../widgets/LoadingIndicator";
import EventEdit from "./EventEdit";
import PageNotFound from "../PageNotFound";

import { CachedCollection, getItemNavigationUid, getDecryptCollectionsFunction, getDecryptItemsFunction, PimFab } from "../Pim/helpers";
import { historyPersistor } from "../persist-state-history";

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
    if (items) {
      decryptItems(items)
        .then((entries) => setEntries(entries));
      // FIXME: handle failure to decrypt items
    }
    if (collections) {
      decryptCollections(collections)
        .then((entries) => setCachedCollections(entries));
      // FIXME: handle failure to decrypt collections
    }
  }, [items, collections]);

  if (!entries || !cachedCollections) {
    return (
      <LoadingIndicator />
    );
  }

  async function onItemSave(item: PimType, collectionUid: string, originalItem?: PimType): Promise<void> {
    const itemUid = originalItem?.itemUid;
    const colMgr = getCollectionManager(etebase);
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    const itemMgr = colMgr.getItemManager(collection);

    const mtime = (new Date()).getTime();
    const content = item.toIcal();

    let eteItem;
    if (itemUid) {
      // Existing item
      eteItem = items!.get(collectionUid)?.get(itemUid)!;
      await eteItem.setContent(content);
      const meta = await eteItem.getMeta();
      meta.mtime = mtime;
      await eteItem.setMeta(meta);
    } else {
      // New
      const meta: Etebase.CollectionItemMetadata = {
        mtime,
        name: item.uid,
      };
      eteItem = await itemMgr.create(meta, content);
    }

    await itemMgr.batch([eteItem]);
  }

  async function onItemDelete(item: PimType, collectionUid: string) {
    const itemUid = item.itemUid!;
    const colMgr = getCollectionManager(etebase);
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    const itemMgr = colMgr.getItemManager(collection);

    const eteItem = items!.get(collectionUid)?.get(itemUid)!;
    const mtime = (new Date()).getTime();
    const meta = await eteItem.getMeta();
    meta.mtime = mtime;
    await eteItem.setMeta(meta);
    await eteItem.delete();
    await itemMgr.batch([eteItem]);

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
                path={routeResolver.getRoute("pim.events._id.log")}
              >
                <h1>Not currently implemented.</h1>
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
            </Switch>
          );
        }}
      />
    </Switch>
  );
}

