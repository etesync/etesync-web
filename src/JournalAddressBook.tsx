import * as React from 'react';
import { Route, Switch, withRouter } from 'react-router';

import * as EteSync from './api/EteSync';

import { routeResolver } from './App';

import AddressBook from './AddressBook';
import Contact from './Contact';

import { ContactType } from './pim-types';

function objValues(obj: any) {
  return Object.keys(obj).map((x) => obj[x]);
}

class JournalAddressBook extends React.PureComponent {
  props: {
    journal: EteSync.Journal,
    entries: {[key: string]: ContactType},
    history?: any,
  };

  constructor(props: any) {
    super(props);
    this.contactClicked = this.contactClicked.bind(this);
  }

  contactClicked(contact: ContactType) {
    const uid = contact.uid;

    this.props.history.push(
      routeResolver.getRoute('journals._id.items._id', { journalUid: this.props.journal.uid, itemUid: uid }));
  }

  render() {
    let items = this.props.entries;

    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('journals._id')}
          exact={true}
          render={() => (
            <AddressBook entries={objValues(items)} onItemClick={this.contactClicked} />
            )
          }
        />
        <Route
          path={routeResolver.getRoute('journals._id.items._id')}
          exact={true}
          render={({match}) => {

            return (
              <Contact contact={items[match.params.itemUid]} />
            );
          }}
        />
      </Switch>
    );
  }
}

export default withRouter(JournalAddressBook);
