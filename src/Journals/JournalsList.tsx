import * as React from 'react';
import { History } from 'history';

import { List, ListItem } from '../widgets/List';

import * as EteSync from '../api/EteSync';

import { routeResolver } from '../App';

import { JournalsData, UserInfoData, CredentialsData } from '../store';

class JournalsList extends React.PureComponent {
  props: {
    etesync: CredentialsData;
    journals: JournalsData;
    userInfo: UserInfoData;
    history: History;
  };

  constructor(props: any) {
    super(props);
    this.journalClicked = this.journalClicked.bind(this);
  }

  render() {
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
        let info = journal.getInfo(cryptoManager);
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
        TASKS: []
      });

    return (
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
    );
  }

  private journalClicked(journalUid: string) {
    this.props.history.push(routeResolver.getRoute('journals._id', { journalUid: journalUid }));
  }
}

export default JournalsList;
