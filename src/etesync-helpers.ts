import * as EteSync from './api/EteSync';

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

  const derived = etesync.encryptionKey;

  let cryptoManager: EteSync.CryptoManager;
  if (journal.key) {
    const keyPair = userInfo.getKeyPair(new EteSync.CryptoManager(derived, 'userInfo', userInfo.version));
    const asymmetricCryptoManager = new EteSync.AsymmetricCryptoManager(keyPair);
    const derivedJournalKey = asymmetricCryptoManager.decryptBytes(journal.key);
    cryptoManager = EteSync.CryptoManager.fromDerivedKey(derivedJournalKey, journal.version);
  } else {
    cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
  }
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
