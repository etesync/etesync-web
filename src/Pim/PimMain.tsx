import * as React from 'react';
import Button from '@material-ui/core/Button';
import ContentAdd from '@material-ui/icons/Add';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { Theme, withTheme } from '@material-ui/core/styles';

import * as ICAL from 'ical.js';

import { Location, History } from 'history';

import Container from '../widgets/Container';

import SearchableAddressBook from '../components/SearchableAddressBook';
import Calendar from '../components/Calendar';

import { EventType, ContactType } from '../pim-types';

import { routeResolver } from '../App';

import { historyPersistor } from '../persist-state-history';

const addressBookTitle = 'Address Book';
const calendarTitle = 'Calendar';

const PersistCalendar = historyPersistor('Calendar')(Calendar);

interface PropsType {
  contacts: Array<ContactType>;
  events: Array<EventType>;
  location?: Location;
  history?: History;
  theme: Theme;
}

class PimMain extends React.PureComponent<PropsType> {
  state: {
    tab: number;
  };

  constructor(props: any) {
    super(props);
    this.state = {tab: 0};
    this.eventClicked = this.eventClicked.bind(this);
    this.contactClicked = this.contactClicked.bind(this);
    this.floatingButtonClicked = this.floatingButtonClicked.bind(this);
    this.newEvent = this.newEvent.bind(this);
  }

  eventClicked(event: ICAL.Event) {
    const uid = event.uid;

    this.props.history!.push(
      routeResolver.getRoute('pim.events._id', { itemUid: uid }));
  }

  contactClicked(contact: ContactType) {
    const uid = contact.uid;

    this.props.history!.push(
      routeResolver.getRoute('pim.contacts._id', { itemUid: uid }));
  }

  newEvent(start?: Date, end?: Date) {
    this.props.history!.push(
      routeResolver.getRoute('pim.events.new'),
      {start, end}
    );
  }

  floatingButtonClicked() {
    if (this.state.tab === 0) {
      this.props.history!.push(
        routeResolver.getRoute('pim.contacts.new')
      );
    } else if (this.state.tab === 1) {
      this.newEvent();
    }
  }

  render() {
    const { theme } = this.props;
    const { tab } = this.state;
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

    return (
      <React.Fragment>
        <Tabs
          fullWidth={true}
          style={{ backgroundColor: theme.palette.primary.main, color: 'white' }}
          value={tab}
          onChange={(event, value) => this.setState({tab: value})}
        >
          <Tab
            label={addressBookTitle}
          />
          <Tab
            label={calendarTitle}
          />
        </Tabs>
        { tab === 0 &&
          <Container>
            <SearchableAddressBook entries={this.props.contacts} onItemClick={this.contactClicked} />
          </Container>
        }
        { tab === 1 &&
          <Container>
            <PersistCalendar
              entries={this.props.events}
              onItemClick={this.eventClicked}
              onSlotClick={this.newEvent}
            />
          </Container>
        }

        <Button
          variant="fab"
          color="primary"
          style={style.floatingButton}
          onClick={this.floatingButtonClicked}
        >
          <ContentAdd />
        </Button>
      </React.Fragment>
    );
  }
}

export default withTheme()(historyPersistor('PimMain')(PimMain));
