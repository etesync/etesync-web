// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { List } from "immutable";

import { EventType, ContactType, TaskType } from "./pim-types";
import { store } from "./store";
import { appendError } from "./store/actions";

import * as EteSync from "etesync";

export function syncEntriesToItemMap(
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: ContactType} = {}) {
  const items = base;

  const errors: Error[] = [];
  entries.forEach((syncEntry) => {
    // FIXME: this is a terrible hack to handle parsing errors
    let comp;
    try {
      comp = ContactType.parse(syncEntry.content);
    } catch (e) {
      e.message = `${e.message}\nWhile processing: ${syncEntry.content}`;
      errors.push(e);
      return;
    }

    // FIXME:Hack
    (comp as any).journalUid = collection.uid;
    const uid = `${collection.uid}|${comp.uid}`;

    if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
      (syncEntry.action === EteSync.SyncEntryAction.Change)) {
      items[uid] = comp;
    } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
      delete items[uid];
    }
  });

  if (errors.length > 0) {
    store.dispatch(appendError(undefined as any, errors));
  }

  return items;
}

export const defaultColor = "#8BC34A";

export function colorIntToHtml(color?: number) {
  if (color === undefined) {
    return defaultColor;
  }

  // tslint:disable:no-bitwise
  color = color >>> 0;
  const blue = color & 0xFF;
  const green = (color >> 8) & 0xFF;
  const red = (color >> 16) & 0xFF;
  const alpha = (color >> 24) & 0xFF;
  // tslint:enable

  function toHex(num: number) {
    const ret = num.toString(16);
    return (ret.length === 1) ? "0" + ret : ret;
  }

  return "#" + toHex(red) + toHex(green) + toHex(blue) + toHex(alpha);
}

export function colorHtmlToInt(color?: string) {
  if (!color) {
    color = defaultColor;
  }

  const match = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i);

  if (!match) {
    return undefined;
  }

  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  const a = (match[4]) ? parseInt(match[4], 16) : 0xFF;

  return (b | (g << 8) | (r << 16) | (a << 24));
}

function syncEntriesToCalendarItemMap<T extends EventType>(
  ItemType: any,
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: T} = {}) {
  const items = base;

  const color = colorIntToHtml(collection.color);

  const errors: Error[] = [];
  entries.forEach((syncEntry) => {
    // FIXME: this is a terrible hack to handle parsing errors
    let comp;
    try {
      comp = ItemType.parse(syncEntry.content);
    } catch (e) {
      e.message = `${e.message}\nWhile processing: ${syncEntry.content}`;
      errors.push(e);
      return;
    }

    if (comp === null) {
      return;
    }

    comp.color = color;

    // FIXME:Hack
    (comp as any).journalUid = collection.uid;
    const uid = `${collection.uid}|${comp.uid}`;

    if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
      (syncEntry.action === EteSync.SyncEntryAction.Change)) {
      items[uid] = comp;
    } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
      delete items[uid];
    }
  });

  if (errors.length > 0) {
    store.dispatch(appendError(undefined as any, errors));
  }

  return items;
}

export function syncEntriesToEventItemMap(
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: EventType} = {}) {
  return syncEntriesToCalendarItemMap<EventType>(EventType, collection, entries, base);
}

export function syncEntriesToTaskItemMap(
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: TaskType} = {}) {
  return syncEntriesToCalendarItemMap<TaskType>(TaskType, collection, entries, base);
}
