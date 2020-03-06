// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import * as EteSync from 'etesync';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import Container from './widgets/Container';
import { useSelector } from 'react-redux';
import { StoreState, CredentialsData, UserInfoData, EntriesListData } from './store';

interface PropsType {
  etesync: CredentialsData;
  userInfo: UserInfoData;
}

export default function Debug(props: PropsType) {
  const [stateJournalUid, setJournalUid] = React.useState('');
  const [entriesUids, setEntriesUids] = React.useState('');
  const [result, setResult] = React.useState('');
  const journals = useSelector((state: StoreState) => state.cache.journals!);
  const journalEntries = useSelector((state: StoreState) => state.cache.entries);

  function handleInputChange(func: (value: string) => void) {
    return (event: React.ChangeEvent<any>) => {
      func(event.target.value);
    };
  }

  return (
    <Container>
      <div>
        <TextField
          style={{ width: '100%' }}
          type="text"
          label="Journal UID"
          value={stateJournalUid}
          onChange={handleInputChange(setJournalUid)}
        />
      </div>
      <div>
        <TextField
          style={{ width: '100%' }}
          type="text"
          multiline
          label="Entry UIDs"
          value={entriesUids}
          onChange={handleInputChange(setEntriesUids)}
        />
      </div>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => {
          const { etesync, userInfo } = props;
          const derived = etesync.encryptionKey;
          const userInfoCryptoManager = userInfo.getCryptoManager(etesync.encryptionKey);
          const keyPair = userInfo.getKeyPair(userInfoCryptoManager);
          const journalUid = stateJournalUid.trim();
          const journal = journals.get(journalUid);
          if (!journal) {
            setResult('Error: journal uid not found.');
            return;
          }

          const wantedEntries = {};
          entriesUids.split('\n').forEach((ent) => wantedEntries[ent.trim()] = true);

          const cryptoManager = journal.getCryptoManager(derived, keyPair);
          let prevUid: string | null = null;

          const entries = journalEntries.get(journalUid)! as EntriesListData;
          const syncEntries = entries.map((entry: EteSync.Entry) => {
            const syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
            prevUid = entry.uid;

            return (wantedEntries[entry.uid]) ? syncEntry : undefined;
          }).filter((x) => x !== undefined);

          setResult(syncEntries.map((ent) => ent?.content).join('\n\n'));
        }}
      >
        Decrypt
      </Button>
      <div>
        <p>Result:</p>
        <pre>{result}</pre>
      </div>
    </Container>
  );
}
