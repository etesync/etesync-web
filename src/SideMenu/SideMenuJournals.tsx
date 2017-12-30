import * as React from 'react';

import { ListItem } from '../widgets/List';

import * as EteSync from '../api/EteSync';

import { JournalsData, UserInfoData, CredentialsData } from '../store';

class SideMenuJournals extends React.PureComponent {
  props: {
    etesync: CredentialsData;
    journals: JournalsData;
    userInfo: UserInfoData;
    onItemClick: (journalUid: string) => void;
  };

  constructor(props: any) {
    super(props);
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
          <ListItem key={journal.uid} onClick={() => this.props.onItemClick(journal.uid)}>
            {info.displayName} ({journal.uid.slice(0, 5)})
          </ListItem>
        );

        return ret;
      },
      { CALENDAR: [],
        ADDRESS_BOOK: []
      });

    return (
      <React.Fragment>
        <ListItem
          primaryText="Address Books"
          nestedItems={journalMap.ADDRESS_BOOK}
        />

        <ListItem
          primaryText="Calendars"
          nestedItems={journalMap.CALENDAR}
        />
      </React.Fragment>
    );
  }
}

export default SideMenuJournals;
