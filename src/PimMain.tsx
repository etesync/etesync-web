import * as React from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';

import * as ICAL from 'ical.js';

import AddressBook from './AddressBook';
import Calendar from './Calendar';

import { EventType, ContactType } from './pim-types';

import { routeResolver } from './App';

const addressBookTitle = 'Address Book';
const calendarTitle = 'Calendar';

class PimMain extends React.Component {
  props: {
    contacts: Array<ContactType>,
    events: Array<EventType>,
    history?: any,
  };

  state: {
    tab?: string;
  };

  constructor(props: any) {
    super(props);
    this.state = {};
    this.eventClicked = this.eventClicked.bind(this);
    this.contactClicked = this.contactClicked.bind(this);
  }

  eventClicked(event: ICAL.Event) {
    const uid = event.uid;

    this.props.history.push(
      routeResolver.getRoute('pim.events._id', { eventUid: uid }));
  }

  contactClicked(contact: ContactType) {
    const uid = contact.uid;

    this.props.history.push(
      routeResolver.getRoute('pim.contacts._id', { contactUid: uid }));
  }

  render() {

    return (
      <Tabs
        value={this.state.tab}
        onChange={(value) => this.setState({tab: value})}
      >
        <Tab
          value={addressBookTitle}
          label={addressBookTitle}
        >
          <AddressBook entries={this.props.contacts} onItemClick={this.contactClicked} />
        </Tab>
        <Tab
          value={calendarTitle}
          label={calendarTitle}
        >
          <Calendar entries={this.props.events} onItemClick={this.eventClicked} />
        </Tab>
      </Tabs>
    );
  }
}

export default PimMain;
