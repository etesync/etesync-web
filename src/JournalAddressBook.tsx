import * as React from 'react';
import { Route, Switch, withRouter } from 'react-router';

import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

import { routeResolver } from './App';

import AddressBook from './AddressBook';
import Contact from './Contact';

class JournalAddressBook extends React.Component {
  props: {
    journal: EteSync.Journal,
    entries: Array<EteSync.SyncEntry>,
    history?: any,
  };

  constructor(props: any) {
    super(props);
    this.contactClicked = this.contactClicked.bind(this);
  }

  contactClicked(contact: ICAL.Component) {
    const uid = contact.getFirstPropertyValue('uid');

    this.props.history.push(
      routeResolver.getRoute('journals._id.items._id', { journalUid: this.props.journal.uid, itemUid: uid }));
  }

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

    return (
      <div>
        <Switch>
          <Route
            path={routeResolver.getRoute('journals._id')}
            exact={true}
            render={() => (
                <AddressBook entries={items} onItemClick={this.contactClicked} />
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

export default withRouter(JournalAddressBook);
