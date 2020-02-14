import * as React from 'react';
import { History } from 'history';

import { Link } from 'react-router-dom';

import IconButton from '@material-ui/core/IconButton';
import IconAdd from '@material-ui/icons/Add';

import { List, ListItem } from '../widgets/List';

import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';

import { routeResolver } from '../App';

import { JournalsData, UserInfoData, CredentialsData } from '../store';
import ColorBox from '../widgets/ColorBox';
import { colorIntToHtml } from '../journal-processors';

interface PropsType {
  etesync: CredentialsData;
  journals: JournalsData;
  userInfo: UserInfoData;
  history: History;
}

export default function JournalsList(props: PropsType) {
  const derived = props.etesync.encryptionKey;

  function journalClicked(journalUid: string) {
    props.history.push(routeResolver.getRoute('journals._id', { journalUid }));
  }

  const journalMap = props.journals.reduce(
    (ret, journal) => {
      const userInfo = props.userInfo;
      const keyPair = userInfo.getKeyPair(userInfo.getCryptoManager(derived));
      const cryptoManager = journal.getCryptoManager(derived, keyPair);
      const info = journal.getInfo(cryptoManager);
      let colorBox: React.ReactNode;
      switch (info.type) {
        case 'CALENDAR':
        case 'TASKS':
          colorBox = (
            <ColorBox size={24} color={colorIntToHtml(info.color)} />
          );
          break;
      }
      ret[info.type] = ret[info.type] || [];
      ret[info.type].push(
        <ListItem key={journal.uid} rightIcon={colorBox}
          onClick={() => journalClicked(journal.uid)}>
          {info.displayName} ({journal.uid.slice(0, 5)})
        </ListItem>
      );

      return ret;
    },
    {
      CALENDAR: [],
      ADDRESS_BOOK: [],
      TASKS: [],
    });

  return (
    <Container>
      <AppBarOverride title="Journals">
        <IconButton
          component={Link}
          title="New"
          {...{ to: routeResolver.getRoute('journals.new') }}
        >
          <IconAdd />
        </IconButton>
      </AppBarOverride>
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
    </Container>
  );
}