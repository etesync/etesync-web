import * as ICAL from 'ical.js';

import { EventType, ContactType } from './pim-types';

import * as EteSync from './api/EteSync';

export function syncEntriesToItemMap(entries: EteSync.SyncEntry[]) {
  let items: {[key: string]: ContactType} = {};

  for (const syncEntry of entries) {
    let comp = new ContactType(new ICAL.Component(ICAL.parse(syncEntry.content)));

    const uid = comp.uid;

    if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
      (syncEntry.action === EteSync.SyncEntryAction.Change)) {
      items[uid] = comp;
    } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
      delete items[uid];
    }
  }

  return items;
}

export function syncEntriesToCalendarItemMap(entries: EteSync.SyncEntry[]) {
  let items: {[key: string]: EventType} = {};

  for (const syncEntry of entries) {
    let comp = new EventType(new ICAL.Component(ICAL.parse(syncEntry.content)).getFirstSubcomponent('vevent'));

    if (comp === null) {
      continue;
    }

    const uid = comp.uid;

    if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
      (syncEntry.action === EteSync.SyncEntryAction.Change)) {
      items[uid] = comp;
    } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
      delete items[uid];
    }
  }

  return items;
}
