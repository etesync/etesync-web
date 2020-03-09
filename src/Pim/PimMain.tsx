// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import Fab from '@material-ui/core/Fab';
import ContentAdd from '@material-ui/icons/Add';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { Theme, withTheme } from '@material-ui/core/styles';

import * as ICAL from 'ical.js';

import * as EteSync from 'etesync';

import { Location, History } from 'history';

import Container from '../widgets/Container';

import SearchableAddressBook from '../components/SearchableAddressBook';
import Calendar from '../components/Calendar';
import TaskList from '../components/Tasks/TaskList';

import { EventType, ContactType, TaskType, PimType } from '../pim-types';

import { routeResolver } from '../App';

import { historyPersistor } from '../persist-state-history';

const addressBookTitle = 'Address Book';
const calendarTitle = 'Calendar';
const tasksTitle = 'Tasks';

const PersistCalendar = historyPersistor('Calendar')(Calendar);

interface PropsType {
  contacts: ContactType[];
  events: EventType[];
  tasks: TaskType[];
  location?: Location;
  history?: History;
  theme: Theme;
  collectionsTaskList: EteSync.CollectionInfo[];
  onItemSave: (item: PimType, journalUid: string, originalItem?: PimType) => void;
}

class PimMain extends React.PureComponent<PropsType> {
  public state: {
    tab: number;
  };

  constructor(props: any) {
    super(props);
    this.state = { tab: 1 };
    this.eventClicked = this.eventClicked.bind(this);
    this.taskClicked = this.taskClicked.bind(this);
    this.contactClicked = this.contactClicked.bind(this);
    this.floatingButtonClicked = this.floatingButtonClicked.bind(this);
    this.newEvent = this.newEvent.bind(this);
  }

  public eventClicked(event: ICAL.Event) {
    // FIXME:Hack
    const itemUid = `${(event as any).journalUid}|${event.uid}`;

    this.props.history!.push(
      routeResolver.getRoute('pim.events._id', { itemUid }));
  }

  public taskClicked(event: ICAL.Event) {
    // FIXME:Hack
    const itemUid = `${(event as any).journalUid}|${event.uid}`;

    this.props.history!.push(
      routeResolver.getRoute('pim.tasks._id.edit', { itemUid }));
  }

  public contactClicked(contact: ContactType) {
    // FIXME:Hack
    const itemUid = `${(contact as any).journalUid}|${contact.uid}`;

    this.props.history!.push(
      routeResolver.getRoute('pim.contacts._id', { itemUid }));
  }

  public newEvent(start?: Date, end?: Date) {
    this.props.history!.push(
      routeResolver.getRoute('pim.events.new'),
      { start, end }
    );
  }

  public floatingButtonClicked() {
    if (this.state.tab === 0) {
      this.props.history!.push(
        routeResolver.getRoute('pim.contacts.new')
      );
    } else if (this.state.tab === 1) {
      this.newEvent();
    } else if (this.state.tab === 2) {
      this.props.history!.push(
        routeResolver.getRoute('pim.tasks.new')
      );
    }
  }

  public render() {
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
          variant="fullWidth"
          style={{ backgroundColor: theme.palette.primary.main }}
          value={tab}
          onChange={(_event, value) => this.setState({ tab: value })}
        >
          <Tab
            label={addressBookTitle}
          />
          <Tab
            label={calendarTitle}
          />
          <Tab
            label={tasksTitle}
          />
        </Tabs>

        <Container>
          {tab === 0 &&
            <SearchableAddressBook entries={this.props.contacts} onItemClick={this.contactClicked} />
          }
          {tab === 1 &&
            <PersistCalendar
              entries={this.props.events}
              onItemClick={this.eventClicked}
              onSlotClick={this.newEvent}
            />
          }
          {tab === 2 &&
            <TaskList
              entries={this.props.tasks}
              collections={this.props.collectionsTaskList}
              onItemClick={this.taskClicked}
              onItemSave={this.props.onItemSave}
            />
          }
        </Container>

        <Fab
          color="primary"
          style={style.floatingButton}
          onClick={this.floatingButtonClicked}
        >
          <ContentAdd />
        </Fab>
      </React.Fragment>
    );
  }
}

export default withTheme(historyPersistor('PimMain')(PimMain));
