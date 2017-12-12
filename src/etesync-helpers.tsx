import * as EteSync from './api/EteSync';

import { CredentialsData, createEntries } from './store';

export function createJournalEntry(
  etesync: CredentialsData,
  journal: EteSync.Journal,
  existingEntries: Array<EteSync.Entry>,
  action: EteSync.SyncEntryAction,
  content: string) {

  let syncEntry = new EteSync.SyncEntry();
  syncEntry.action = action;

  syncEntry.content = content;

  const derived = etesync.encryptionKey;
  let prevUid: string | null = null;

  const entries = existingEntries;
  if (entries.length > 0) {
    prevUid = entries[entries.length - 1].uid;
  }

  const cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
  let entry = new EteSync.Entry();
  entry.setSyncEntry(cryptoManager, syncEntry, prevUid);

  return createEntries(etesync, journal.uid, [entry], prevUid);
}
