import * as React from 'react';
const Fragment = (React as any).Fragment;
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
            <Link
              key={journal.uid}
              to={routeResolver.getRoute('journals._id', { journalUid: journal.uid })}
            >
              <ListItem>
                {info.displayName} ({journal.uid.slice(0, 5)})
              </ListItem>
            </Link>
          );
        }

        return ret;
      },
      { CALENDAR: [],
        ADDRESS_BOOK: [],
        UNSUPPORTED: [] as Array<JSX.Element>});

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

        { journalMap.UNSUPPORTED && (
          <Fragment>
            <h2>Unsupported</h2>
            <List>
              {journalMap.UNSUPPORTED}
            </List>
          </Fragment>
        )}
      </Paper>
    );
  }
}

export default JournalList;
