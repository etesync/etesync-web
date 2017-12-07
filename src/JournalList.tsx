import * as React from 'react';
import { Link } from 'react-router-dom';

import { List, ListItem } from 'material-ui/List';
import Paper from 'material-ui/Paper';

import * as EteSync from './api/EteSync';

import { routeResolver } from './App';
import { JournalsData, CredentialsData } from './store';

class JournalList extends React.Component {
  props: {
    etesync: CredentialsData;
    journals: JournalsData;
  };

  constructor(props: any) {
    super(props);
  }

  render() {
    const derived = this.props.etesync.encryptionKey;
    const journalMap = this.props.journals.filter((x) => (
        // Skip shared journals for now.
        !x.key
      )).reduce(
      (ret, journal) => {
        let cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
        let info = journal.getInfo(cryptoManager);
        ret[info.type] = ret[info.type] || [];
        ret[info.type].push(
          <Link
            key={journal.uid}
            to={routeResolver.getRoute('journals._id', { journalUid: journal.uid })}
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

    const styles = {
      paper: {
        margin: 'auto',
        maxWidth: 500,
        padding: 20,
      },
    };

    return (
      <Paper style={styles.paper} zDepth={2}>
        <h2>Address Books</h2>
        <List>
          {journalMap.ADDRESS_BOOK}
        </List>

        <h2>Calendars</h2>
        <List>
          {journalMap.CALENDAR}
        </List>
      </Paper>
    );
  }
}

export default JournalList;
