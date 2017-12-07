import * as React from 'react';
import { Route, Switch } from 'react-router';
import { List, ListItem } from 'material-ui/List';
import { Link } from 'react-router-dom';

import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

import { routeResolver } from './App';
import Contact from './Contact';

class JournalAddressBook extends React.Component {
  static defaultProps = {
    prevUid: null,
  };

  props: {
    journal: EteSync.Journal,
    entries: Array<EteSync.SyncEntry>,
  };

  render() {
    if (this.props.journal === undefined) {
      return (<div>Loading</div>);
    }

    let items: Map<string, ICAL.Component> = new Map();

    for (const syncEntry of this.props.entries) {
      let comp = new ICAL.Component(ICAL.parse(syncEntry.content));

      const uid = comp.getFirstPropertyValue('uid');

      if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
        (syncEntry.action === EteSync.SyncEntryAction.Change)) {
        items.set(uid, comp);
      } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
        items.delete(uid);
      }
    }

    let entries = Array.from(items.values()).sort((_a, _b) => {
      const a = _a.getFirstPropertyValue('fn');
      const b = _b.getFirstPropertyValue('fn');

      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    });

    let itemList = entries.map((entry) => {
      const uid = entry.getFirstPropertyValue('uid');
      const name = entry.getFirstPropertyValue('fn');
      return (
        <Link
          key={uid}
          to={routeResolver.getRoute('journals._id.items._id', { journalUid: this.props.journal.uid, itemUid: uid })}
        >
          <ListItem primaryText={name} />
        </Link>
      );
    });

    return (
      <div>
        <Switch>
          <Route
            path={routeResolver.getRoute('journals._id')}
            exact={true}
            render={() => (
                <List>
                  {itemList}
                </List>
              )
            }
          />
          <Route
            path={routeResolver.getRoute('journals._id.items._id')}
            exact={true}
            render={({match}) => {

              return (
                <Contact contact={items.get(match.params.itemUid)} />
              );
            }}
          />
        </Switch>
      </div>
    );
  }
}

export default JournalAddressBook;
