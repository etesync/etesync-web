import { List } from 'immutable';

import * as EteSync from './api/EteSync';

import { CredentialsData, createEntries } from './store';

export function createJournalEntry(
  etesync: CredentialsData,
  journal: EteSync.Journal,
  existingEntries: List<EteSync.Entry>,
  action: EteSync.SyncEntryAction,
  content: string) {

  let syncEntry = new EteSync.SyncEntry();
  syncEntry.action = action;

  syncEntry.content = content;

  const derived = etesync.encryptionKey;
  let prevUid: string | null = null;

  const entries = existingEntries;
  const last = entries.last();
  if (last) {
    prevUid = last.uid;
  }

  const cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
  let entry = new EteSync.Entry();
  entry.setSyncEntry(cryptoManager, syncEntry, prevUid);

  return createEntries(etesync, journal.uid, [entry], prevUid);
}
