import * as React from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';

import * as ICAL from 'ical.js';

import Container from './Container';

import AddressBook from './AddressBook';
import Calendar from './Calendar';

import { EventType, ContactType } from './pim-types';

import { routeResolver } from './App';

import { historyPersistor } from './persist-state-history';

const addressBookTitle = 'Address Book';
const calendarTitle = 'Calendar';

class PimMain extends React.Component {
  props: {
    contacts: Array<ContactType>,
    events: Array<EventType>,
    location?: any,
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
    const PersistCalendar = historyPersistor(Calendar, 'Calendar');

    return (
      <Tabs
        value={this.state.tab}
        onChange={(value) => this.setState({tab: value})}
      >
        <Tab
          value={addressBookTitle}
          label={addressBookTitle}
        >
          <Container>
            <AddressBook entries={this.props.contacts} onItemClick={this.contactClicked} />
          </Container>
        </Tab>
        <Tab
          value={calendarTitle}
          label={calendarTitle}
        >
          <Container>
            <PersistCalendar entries={this.props.events} onItemClick={this.eventClicked} />
          </Container>
        </Tab>
      </Tabs>
    );
  }
}

export default historyPersistor(PimMain, 'PimMain');
