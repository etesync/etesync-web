import * as React from 'react';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
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
    tab: string;
  };

  constructor(props: any) {
    super(props);
    this.state = {tab: addressBookTitle};
    this.eventClicked = this.eventClicked.bind(this);
    this.contactClicked = this.contactClicked.bind(this);
    this.floatingButtonClicked = this.floatingButtonClicked.bind(this);
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

  floatingButtonClicked() {
    if (this.state.tab === addressBookTitle) {
      this.props.history.push(
        routeResolver.getRoute('pim.contacts.new')
      );
    } else if (this.state.tab === calendarTitle) {
      this.props.history.push(
        routeResolver.getRoute('pim.events.new')
      );
    }
  }

  render() {
    const style = {
      floatingButton: {
        margin: 0,
        top: 'auto',
        right: 20,
        bottom: 20,
        left: 'auto',
        position: 'fixed',
      } as any,
    };

    const PersistCalendar = historyPersistor(Calendar, 'Calendar');

    return (
      <React.Fragment>
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

        <FloatingActionButton
          style={style.floatingButton}
          onClick={this.floatingButtonClicked}
        >
          <ContentAdd />
        </FloatingActionButton>
      </React.Fragment>
    );
  }
}

export default historyPersistor(PimMain, 'PimMain');
