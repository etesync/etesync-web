import * as EteSync from 'etesync';

import { CredentialsData, UserInfoData } from './store';
import { addEntries } from './store/actions';

export function createJournalEntry(
  etesync: CredentialsData,
  userInfo: UserInfoData,
  journal: EteSync.Journal,
  prevUid: string | null,
  action: EteSync.SyncEntryAction,
  content: string) {

  const syncEntry = new EteSync.SyncEntry();
  syncEntry.action = action;
  syncEntry.content = content;

  return createJournalEntryFromSyncEntry(etesync, userInfo, journal, prevUid, syncEntry);
}

export function createJournalEntryFromSyncEntry(
  etesync: CredentialsData,
  userInfo: UserInfoData,
  journal: EteSync.Journal,
  prevUid: string | null,
  syncEntry: EteSync.SyncEntry) {

  const derived = etesync.encryptionKey;

  const keyPair = userInfo.getKeyPair(userInfo.getCryptoManager(derived));
  const cryptoManager = journal.getCryptoManager(derived, keyPair);
  const entry = new EteSync.Entry();
  entry.setSyncEntry(cryptoManager, syncEntry, prevUid);

  return entry;
}

export function addJournalEntry(
  etesync: CredentialsData,
  userInfo: UserInfoData,
  journal: EteSync.Journal,
  prevUid: string | null,
  action: EteSync.SyncEntryAction,
  content: string) {

  const entry = createJournalEntry(etesync, userInfo, journal, prevUid, action, content);
  return addEntries(etesync, journal.uid, [entry], prevUid);
}
