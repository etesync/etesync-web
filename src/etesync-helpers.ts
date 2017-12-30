import { List } from 'immutable';

import * as EteSync from './api/EteSync';

import { CredentialsData, UserInfoData } from './store';
import { createEntries } from './store/actions';

export function createJournalEntry(
  etesync: CredentialsData,
  userInfo: UserInfoData,
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

  let cryptoManager: EteSync.CryptoManager;
  if (journal.key) {
    const keyPair = userInfo.getKeyPair(new EteSync.CryptoManager(derived, 'userInfo', userInfo.version));
    const asymmetricCryptoManager = new EteSync.AsymmetricCryptoManager(keyPair);
    const derivedJournalKey = asymmetricCryptoManager.decryptBytes(journal.key);
    cryptoManager = EteSync.CryptoManager.fromDerivedKey(derivedJournalKey, journal.version);
  } else {
    cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
  }
  let entry = new EteSync.Entry();
  entry.setSyncEntry(cryptoManager, syncEntry, prevUid);

  return createEntries(etesync, journal.uid, [entry], prevUid);
}
