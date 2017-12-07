import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

export function syncEntriesToItemMap(entries: EteSync.SyncEntry[]) {
  let items: Map<string, ICAL.Component> = new Map();

  for (const syncEntry of entries) {
    let comp = new ICAL.Component(ICAL.parse(syncEntry.content));

    const uid = comp.getFirstPropertyValue('uid');

    if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
      (syncEntry.action === EteSync.SyncEntryAction.Change)) {
      items.set(uid, comp);
    } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
      items.delete(uid);
    }
  }

  return items;
}
