// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import moment from "moment";

import * as Etebase from "etebase";

import { AutoSizer, List as VirtualizedList } from "react-virtualized";

import { List, ListItem } from "../widgets/List";
import IconEdit from "@material-ui/icons/Edit";
import IconDelete from "@material-ui/icons/Delete";
import IconError from "@material-ui/icons/Error";

import { TaskType, EventType, ContactType, parseString } from "../pim-types";

export interface CachedItem {
  item: Etebase.Item;
  metadata: Etebase.ItemMetadata;
  content: string;
}

interface PropsType {
  items: CachedItem[];
  onItemClick: (item: CachedItem) => void;

}

export default function GenericChangeHistory(props: PropsType) {
  const entriesList = props.items.sort((a_, b_) => {
    const a = a_.metadata.mtime ?? 0;
    const b = b_.metadata.mtime ?? 0;
    return a - b;
  });

  const onItemClick = props.onItemClick;

  const rowRenderer = (params: { index: number, key: string, style: React.CSSProperties }) => {
    const { key, index, style } = params;
    const cacheItem = entriesList[entriesList.length - index - 1]!;
    let comp;
    try {
      comp = parseString(cacheItem.content);
    } catch (e) {
      const icon = (<IconError style={{ color: "red" }} />);
      return (
        <ListItem
          key={key}
          style={style}
          leftIcon={icon}
          primaryText="Failed parsing item"
          secondaryText="Unknown"
          onClick={() => onItemClick(cacheItem)}
        />
      );
    }

    let icon;
    if (!cacheItem.item.isDeleted) {
      icon = (<IconEdit style={{ color: "#16B14B" }} />);
    } else {
      icon = (<IconDelete style={{ color: "#F20C0C" }} />);
    }

    let name;
    if (comp.name === "vcalendar") {
      if (EventType.isEvent(comp)) {
        const vevent = EventType.fromVCalendar(comp);
        name = vevent.summary;
      } else {
        const vtodo = TaskType.fromVCalendar(comp);
        name = vtodo.summary;
      }
    } else if (comp.name === "vcard") {
      const vcard = new ContactType(comp);
      name = vcard.fn;
    } else {
      name = "Error processing entry";
    }

    const mtime = (cacheItem.metadata.mtime) ? moment(cacheItem.metadata.mtime) : undefined;

    return (
      <ListItem
        key={key}
        style={style}
        leftIcon={icon}
        primaryText={name}
        secondaryText={mtime && mtime.format("llll")}
        onClick={() => onItemClick(cacheItem)}
      />
    );
  };

  return (
    <List style={{ height: "100%" }}>
      <AutoSizer>
        {({ height, width }) => (
          <VirtualizedList
            width={width}
            height={height}
            rowCount={entriesList.length}
            rowHeight={56}
            rowRenderer={rowRenderer}
          />
        )}
      </AutoSizer>
    </List>
  );
}
