import { List } from 'immutable';

import * as ICAL from 'ical.js';

import { EventType, ContactType } from './pim-types';

import * as EteSync from './api/EteSync';

export function syncEntriesToItemMap(collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>) {
  let items: {[key: string]: ContactType} = {};

  entries.forEach((syncEntry) => {
    let comp = new ContactType(new ICAL.Component(ICAL.parse(syncEntry.content)));

    const uid = comp.uid;

    // FIXME:Hack
    (comp as any).journalUid = collection.uid;

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
    let ret = num.toString(16);
    return (ret.length === 1) ? '0' + ret : ret;
  }

  return '#' + toHex(red) + toHex(green) + toHex(blue) +
    ((alpha > 0) ? toHex(alpha) : '');
}

export function syncEntriesToCalendarItemMap(collection: EteSync.CollectionInfo, entries: List<EteSync.SyncEntry>) {
  let items: {[key: string]: EventType} = {};

  const color = colorIntToHtml(collection.color);

  entries.forEach((syncEntry) => {
    let comp = EventType.fromVCalendar(new ICAL.Component(ICAL.parse(syncEntry.content)));

    if (comp === null) {
      return;
    }

    comp.color = color;

    const uid = comp.uid;

    // FIXME:Hack
    (comp as any).journalUid = collection.uid;

    if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
      (syncEntry.action === EteSync.SyncEntryAction.Change)) {
      items[uid] = comp;
    } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
      delete items[uid];
    }
  });

  return items;
}
