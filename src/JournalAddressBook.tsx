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
    entries: Map<string, ICAL.Component>,
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

    let items = this.props.entries;

    return (
      <div>
        <Switch>
          <Route
            path={routeResolver.getRoute('journals._id')}
            exact={true}
            render={() => (
                <AddressBook entries={Array.from(items.values())} onItemClick={this.contactClicked} />
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
