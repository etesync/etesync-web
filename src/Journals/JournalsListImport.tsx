import * as React from 'react';

import { List, ListItem } from '../widgets/List';

import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';

import { JournalsData, UserInfoData, CredentialsData } from '../store';
import ImportDialog from './ImportDialog';
import { SyncInfo, SyncInfoJournal } from '../SyncGate';

interface PropsType {
  etesync: CredentialsData;
  journals: JournalsData;
  userInfo: UserInfoData;
  syncInfo: SyncInfo;
}

export default function JournalsList(props: PropsType) {
  const [selectedJournal, setSelectedJournal] = React.useState<SyncInfoJournal>();
  const derived = props.etesync.encryptionKey;

  const journalMap = props.journals.reduce(
    (ret, journal) => {
      const userInfo = props.userInfo;
      const keyPair = userInfo.getKeyPair(userInfo.getCryptoManager(derived));
      const cryptoManager = journal.getCryptoManager(derived, keyPair);
      const info = journal.getInfo(cryptoManager);
      ret[info.type] = ret[info.type] || [];
      ret[info.type].push(
        <ListItem key={journal.uid} onClick={() => setSelectedJournal(props.syncInfo.get(journal.uid))}>
          {info.displayName} ({journal.uid.slice(0, 5)})
        </ListItem>
      );

      return ret;
    },
    { CALENDAR: [],
      ADDRESS_BOOK: [],
      TASKS: [],
    });

  return (
    <Container>
      <AppBarOverride title="Journals Import" />
      <List>
        <ListItem
          primaryText="Address Books"
          nestedItems={journalMap.ADDRESS_BOOK}
        />

        <ListItem
          primaryText="Calendars"
          nestedItems={journalMap.CALENDAR}
        />

        <ListItem
          primaryText="Tasks"
          nestedItems={journalMap.TASKS}
        />
      </List>
      {selectedJournal && (
        <ImportDialog
          etesync={props.etesync}
          userInfo={props.userInfo}
          syncJournal={selectedJournal}
          open={!!selectedJournal}
          onClose={() => setSelectedJournal(undefined)}
        />
      )}
    </Container>
  );
}