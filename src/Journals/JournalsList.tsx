import * as React from 'react';
import { History } from 'history';

import { Link } from 'react-router-dom';

import IconButton from '@material-ui/core/IconButton';
import IconAdd from '@material-ui/icons/Add';

import { List, ListItem } from '../widgets/List';

import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';

import * as EteSync from '../api/EteSync';

import { routeResolver } from '../App';

import { JournalsData, UserInfoData, CredentialsData } from '../store';

class JournalsList extends React.PureComponent {
  public props: {
    etesync: CredentialsData;
    journals: JournalsData;
    userInfo: UserInfoData;
    history: History;
  };

  constructor(props: any) {
    super(props);
    this.journalClicked = this.journalClicked.bind(this);
  }

  public render() {
    const derived = this.props.etesync.encryptionKey;
    let asymmetricCryptoManager: EteSync.AsymmetricCryptoManager;
    const journalMap = this.props.journals.reduce(
      (ret, journal) => {
        let cryptoManager: EteSync.CryptoManager;
        if (journal.key) {
          if (!asymmetricCryptoManager) {
            const userInfo = this.props.userInfo;
            const keyPair = userInfo.getKeyPair(new EteSync.CryptoManager(derived, 'userInfo', userInfo.version));
            asymmetricCryptoManager = new EteSync.AsymmetricCryptoManager(keyPair);
          }
          const derivedJournalKey = asymmetricCryptoManager.decryptBytes(journal.key);
          cryptoManager = EteSync.CryptoManager.fromDerivedKey(derivedJournalKey, journal.version);
        } else {
          cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
        }
        const info = journal.getInfo(cryptoManager);
        ret[info.type] = ret[info.type] || [];
        ret[info.type].push(
          <ListItem key={journal.uid} onClick={() => this.journalClicked(journal.uid)}>
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
        <AppBarOverride title="Journals">
          <IconButton
            component={Link}
            title="New"
            {...{to: routeResolver.getRoute('journals.new')}}
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

  private journalClicked(journalUid: string) {
    this.props.history.push(routeResolver.getRoute('journals._id', { journalUid }));
  }
}

export default JournalsList;
