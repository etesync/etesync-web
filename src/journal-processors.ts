import { List } from 'immutable';

import * as ICAL from 'ical.js';

import { EventType, ContactType, TaskType } from './pim-types';

import * as EteSync from './api/EteSync';

export function syncEntriesToItemMap(
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: ContactType} = {}) {
  const items = base;

  entries.forEach((syncEntry) => {
    const comp = new ContactType(new ICAL.Component(ICAL.parse(syncEntry.content)));

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

  return items;
}

function colorIntToHtml(color: number) {
  if (color === undefined) {
    return '#8BC34A';
  }

  // tslint:disable:no-bitwise
  const blue = color & 0xFF;
  const green = (color >> 8) & 0xFF;
  const red = (color >> 16) & 0xFF;
  const alpha = (color >> 24) & 0xFF;
  // tslint:enable

  function toHex(num: number) {
    const ret = num.toString(16);
    return (ret.length === 1) ? '0' + ret : ret;
  }

  return '#' + toHex(red) + toHex(green) + toHex(blue) +
    ((alpha > 0) ? toHex(alpha) : '');
}

function syncEntriesToCalendarItemMap<T extends EventType>(
  ItemType: any,
  collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>, base: {[key: string]: T} = {}) {
  const items = base;

  const color = colorIntToHtml(collection.color);

  entries.forEach((syncEntry) => {
    const comp = ItemType.fromVCalendar(new ICAL.Component(ICAL.parse(syncEntry.content)));

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
