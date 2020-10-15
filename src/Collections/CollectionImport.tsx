// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import ContactsIcon from "@material-ui/icons/Contacts";
import CalendarTodayIcon from "@material-ui/icons/CalendarToday";
import FormatListBulletedIcon from "@material-ui/icons/FormatListBulleted";

import { List, ListItem } from "../widgets/List";

import AppBarOverride from "../widgets/AppBarOverride";
import Container from "../widgets/Container";

import { CachedCollection, defaultColor } from "../Pim/helpers";
import ColorBox from "../widgets/ColorBox";
import ImportDialog from "./ImportDialog";

interface PropsType {
  collections: CachedCollection[];
}

export default function CollectionImport(props: PropsType) {
  const [selectedCollection, setSelectedCollection] = React.useState<CachedCollection>();

  const collectionMap = {
    "etebase.vcard": [],
    "etebase.vevent": [],
    "etebase.vtodo": [],
  };

  function colClicked(colUid: string) {
    const collection = props.collections.find((x) => x.collection.uid === colUid);
    setSelectedCollection(collection);
  }

  for (const col of props.collections) {
    const colType = col.collectionType;
    if (collectionMap[colType]) {
      const supportsColor = (["etebase.vevent", "etebase.vtodo"].includes(colType));
      const colorBox = (supportsColor) ? (
        <ColorBox size={24} color={col.metadata.color || defaultColor} />
      ) : undefined;

      collectionMap[colType].push((
        <ListItem key={col.collection.uid} rightIcon={colorBox} insetChildren
          onClick={() => colClicked(col.collection.uid)}>
          {col.metadata.name}
        </ListItem>
      ));
    }
  }

  return (
    <Container>
      <AppBarOverride title="Import" />
      <List>
        <ListItem
          primaryText="Address Books"
          leftIcon={<ContactsIcon />}
          nestedItems={collectionMap["etebase.vcard"]}
        />

        <ListItem
          primaryText="Calendars"
          leftIcon={<CalendarTodayIcon />}
          nestedItems={collectionMap["etebase.vevent"]}
        />

        <ListItem
          primaryText="Tasks"
          leftIcon={<FormatListBulletedIcon />}
          nestedItems={collectionMap["etebase.vtodo"]}
        />
      </List>
      {selectedCollection && (
        <ImportDialog
          key={(!selectedCollection).toString()}
          collection={selectedCollection}
          open
          onClose={() => setSelectedCollection(undefined)}
        />
      )}
    </Container>
  );
}
