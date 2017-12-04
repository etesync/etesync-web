import * as React from 'react';
import { Link } from 'react-router-dom';

import { List, ListItem } from 'material-ui/List';

import { EteSyncContextType } from './EteSyncContext';
import * as EteSync from './api/EteSync';

import { routeResolver } from './App';

export class JournalList extends React.Component {
  props: {
    etesync: EteSyncContextType
  };

  state: {
    journals: Array<EteSync.Journal>,
  };

  constructor(props: any) {
    super(props);
    this.state = {
      journals: [],
    };
  }

  componentDidMount() {
    const credentials = this.props.etesync.credentials;
    const apiBase = this.props.etesync.serviceApiUrl;

    let journalManager = new EteSync.JournalManager(credentials, apiBase);
    journalManager.list().then((journals) => {
      journals = journals.filter((x) => (
        // Skip shared journals for now.
        !x.key
      ));
      this.setState({ journals });
    });
  }

  render() {
    const derived = this.props.etesync.encryptionKey;
    const journalMap = this.state.journals.reduce(
      (ret, journal) => {
        let cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
        let info = journal.getInfo(cryptoManager);
        ret[info.type] = ret[info.type] || [];
        ret[info.type].push(
          <Link
            key={journal.uid}
            to={routeResolver.getRoute('journals._id', { journalUid: journal.uid })}
            className="Drawer-navlink"
          >
            <ListItem>
              {info.displayName} ({journal.uid.slice(0, 5)})
            </ListItem>
          </Link>
        );
        return ret;
      },
      { CALENDAR: [],
        ADDRESS_BOOK: []});

    return (
      <div>
        <h2>Address Books</h2>
        <List>
          {journalMap.ADDRESS_BOOK}
        </List>

        <h2>Calendars</h2>
        <List>
          {journalMap.CALENDAR}
        </List>
      </div>
    );
  }
}
