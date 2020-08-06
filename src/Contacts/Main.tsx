// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Switch, Route, useHistory } from "react-router";

import * as Etebase from "etebase";

import { Button, useTheme } from "@material-ui/core";
import IconEdit from "@material-ui/icons/Edit";
import IconChangeHistory from "@material-ui/icons/ChangeHistory";

import { ContactType, PimType } from "../pim-types";
import { useCredentials } from "../credentials";
import { useItems, useCollections } from "../etebase-helpers";
import { routeResolver } from "../App";
import SearchableAddressBook from "./SearchableAddressBook";
import Contact from "./Contact";
import LoadingIndicator from "../widgets/LoadingIndicator";
import ContactEdit from "./ContactEdit";
import PageNotFound from "../PageNotFound";

import { CachedCollection, getItemNavigationUid, getDecryptCollectionsFunction, getDecryptItemsFunction, PimFab, itemSave, itemDelete } from "../Pim/helpers";

const colType = "etebase.vcard";

const decryptCollections = getDecryptCollectionsFunction(colType);
const decryptItems = getDecryptItemsFunction(colType, ContactType.parse);

export default function ContactsMain() {
  const [entries, setEntries] = React.useState<Map<string, Map<string, ContactType>>>();
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
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    await itemSave(etebase, collection, items!, item, collectionUid, originalItem);
  }

  async function onItemDelete(item: PimType, collectionUid: string) {
    const collection = collections!.find((x) => x.uid === collectionUid)!;
    await itemDelete(etebase, collection, items!, item, collectionUid);

    history.push(routeResolver.getRoute("pim.contacts"));
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
        path={routeResolver.getRoute("pim.contacts")}
        exact
      >
        <SearchableAddressBook
          entries={flatEntries}
          onItemClick={(item) => history.push(
            routeResolver.getRoute("pim.contacts._id", { itemUid: getItemNavigationUid(item) })
          )}
        />
        <PimFab
          onClick={() => history.push(
            routeResolver.getRoute("pim.contacts.new")
          )}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("pim.contacts.new")}
        exact
      >
        <ContactEdit
          collections={cachedCollections}
          onSave={onItemSave}
          onDelete={onItemDelete}
          onCancel={onCancel}
          history={history}
        />
      </Route>
      <Route
        path={routeResolver.getRoute("pim.contacts._id")}
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
                path={routeResolver.getRoute("pim.contacts._id.edit")}
                exact
              >
                <ContactEdit
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
                path={routeResolver.getRoute("pim.contacts._id.log")}
              >
                <h1>Not currently implemented.</h1>
              </Route>
              <Route
                path={routeResolver.getRoute("pim.contacts._id")}
                exact
              >
                <div style={{ textAlign: "right", marginBottom: 15 }}>
                  <Button
                    variant="contained"
                    style={styles.button}
                    onClick={() =>
                      history.push(routeResolver.getRoute("pim.contacts._id.log", { itemUid: getItemNavigationUid(item) }))
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
                      history.push(routeResolver.getRoute("pim.contacts._id.edit", { itemUid: getItemNavigationUid(item) }))
                    }
                  >
                    <IconEdit style={styles.leftIcon} />
                    Edit
                  </Button>

                </div>
                <Contact item={item} />
              </Route>
            </Switch>
          );
        }}
      />
    </Switch>
  );
}

