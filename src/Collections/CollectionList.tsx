// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import { Link, useHistory } from "react-router-dom";

import IconButton from "@material-ui/core/IconButton";
import IconAdd from "@material-ui/icons/Add";
import ContactsIcon from "@material-ui/icons/Contacts";
import CalendarTodayIcon from "@material-ui/icons/CalendarToday";
import FormatListBulletedIcon from "@material-ui/icons/FormatListBulleted";

import { List, ListItem } from "../widgets/List";

import AppBarOverride from "../widgets/AppBarOverride";
import Container from "../widgets/Container";

import { routeResolver } from "../App";
import { CachedCollection, defaultColor } from "../Pim/helpers";
import ColorBox from "../widgets/ColorBox";

interface PropsType {
  collections: CachedCollection[];
}

export default function CollectionList(props: PropsType) {
  const history = useHistory();

  const collectionMap = {
    "etebase.vcard": [],
    "etebase.vevent": [],
    "etebase.vtodo": [],
  };

  function colClicked(colUid: string) {
    history.push(routeResolver.getRoute("collections._id", { colUid }));
  }

  for (const col of props.collections) {
    if (collectionMap[col.metadata.type]) {
      const supportsColor = (["etebase.vevent", "etebase.vtodo"].includes(col.metadata.type));
      const colorBox = (supportsColor) ? (
        <ColorBox size={24} color={col.metadata.color || defaultColor} />
      ) : undefined;

      collectionMap[col.metadata.type].push((
        <ListItem key={col.collection.uid} rightIcon={colorBox} insetChildren
          onClick={() => colClicked(col.collection.uid)}>
          {col.metadata.name}
        </ListItem>
      ));
    }
  }

  return (
    <Container>
      <AppBarOverride title="Collections">
        <IconButton
          component={Link}
          title="New"
          {...{ to: routeResolver.getRoute("collections.new") }}
        >
          <IconAdd />
        </IconButton>
      </AppBarOverride>
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
    </Container>
  );
}
