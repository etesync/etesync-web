import * as React from 'react';
import { Link } from 'react-router-dom';

import { ListItem } from 'material-ui/List';

import * as EteSync from './api/EteSync';

import { routeResolver } from './App';
import { JournalsData, CredentialsData } from './store';

class SideMenuJournals extends React.Component {
  props: {
    etesync: CredentialsData;
    journals: JournalsData;
    onItemClick: () => void;
  };

  constructor(props: any) {
    super(props);
  }

  render() {
    const derived = this.props.etesync.encryptionKey;
    const journalMap = this.props.journals.reduce(
      (ret, journal) => {
        if (journal.key) {
          const key = 'UNSUPPORTED';
          ret[key] = ret[key] || [];
          ret[key].push(
            <ListItem
              key={journal.uid}
            >
              {journal.uid.slice(0, 20)}
            </ListItem>
          );
        } else {
          let cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
          let info = journal.getInfo(cryptoManager);
          ret[info.type] = ret[info.type] || [];
          ret[info.type].push(
            <ListItem key={journal.uid}>
              <Link
                to={routeResolver.getRoute('journals._id', { journalUid: journal.uid })}
                onClick={this.props.onItemClick}
              >
                {info.displayName} ({journal.uid.slice(0, 5)})
              </Link>
            </ListItem>
          );
        }

        return ret;
      },
      { CALENDAR: [],
        ADDRESS_BOOK: [],
        UNSUPPORTED: [] as Array<JSX.Element>});

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

        { journalMap.UNSUPPORTED && (
          <ListItem
            primaryText="UNSUPPORTED"
            nestedItems={journalMap.UNSUPPORTED}
          />
        )}
      </React.Fragment>
    );
  }
}

export default SideMenuJournals;
