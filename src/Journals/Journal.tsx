import * as React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { Theme, withTheme } from '@material-ui/core/styles';
import IconEdit from '@material-ui/icons/Edit';
import IconMembers from '@material-ui/icons/People';

import SearchableAddressBook from '../components/SearchableAddressBook';
import Contact from '../components/Contact';
import Calendar from '../components/Calendar';
import Event from '../components/Event';
import TaskList from '../components/TaskList';

import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';

import JournalEntries from '../components/JournalEntries';
import journalView from './journalView';

import { syncEntriesToItemMap, syncEntriesToEventItemMap, syncEntriesToTaskItemMap } from '../journal-processors';

import { SyncInfo, SyncInfoJournal } from '../SyncGate';

import { Link } from 'react-router-dom';

import { routeResolver } from '../App';
import { historyPersistor } from '../persist-state-history';

interface PropsType {
  syncInfo: SyncInfo;
  syncJournal: SyncInfoJournal;
  isOwner: boolean;
}

interface PropsTypeInner extends PropsType {
  theme: Theme;
}

const JournalAddressBook = journalView(SearchableAddressBook, Contact);
const PersistCalendar = historyPersistor('Calendar')(Calendar);
const JournalCalendar = journalView(PersistCalendar, Event);
const JournalTaskList = journalView(TaskList, Event);

class Journal extends React.Component<PropsTypeInner> {
  public state: {
    tab: number,
  };

  constructor(props: PropsTypeInner) {
    super(props);

    this.state = {
      tab: 0,
    };
  }

  public render() {
    const { theme, isOwner, syncJournal } = this.props;
    let currentTab = this.state.tab;
    let journalOnly = false;

    const journal = syncJournal.journal;
    const collectionInfo = syncJournal.collection;
    const syncEntries = syncJournal.entries;

    let itemsTitle: string;
    let itemsView: JSX.Element;
    if (collectionInfo.type === 'CALENDAR') {
      itemsView = (
        <JournalCalendar
          journal={journal}
          entries={syncEntriesToEventItemMap(collectionInfo, syncEntries)}
        />);
      itemsTitle = 'Events';
    } else if (collectionInfo.type === 'ADDRESS_BOOK') {
      itemsView =
        <JournalAddressBook journal={journal} entries={syncEntriesToItemMap(collectionInfo, syncEntries)} />;
      itemsTitle = 'Contacts';
    } else if (collectionInfo.type === 'TASKS')  {
      itemsView = (
        <JournalTaskList
          journal={journal}
          entries={syncEntriesToTaskItemMap(collectionInfo, syncEntries)}
        />);
      itemsTitle = 'Tasks';
    } else {
      itemsView = <div>Preview is not supported for this journal type</div>;
      itemsTitle = 'Items';
      journalOnly = true;
    }

    currentTab = journalOnly ? 1 : currentTab;

    return (
      <React.Fragment>
        <AppBarOverride title={collectionInfo.displayName}>
          { isOwner &&
            <>
              <IconButton
                component={Link}
                title="Edit"
                {...{to: routeResolver.getRoute('journals._id.edit', { journalUid: journal.uid })}}
              >
                <IconEdit />
              </IconButton>
              <IconButton
                component={Link}
                title="Members"
                {...{to: routeResolver.getRoute('journals._id.members', { journalUid: journal.uid })}}
              >
                <IconMembers />
              </IconButton>
            </>
          }
        </AppBarOverride>
        <Tabs
          variant="fullWidth"
          style={{ backgroundColor: theme.palette.primary.main }}
          value={currentTab}
          onChange={(event, tab) => this.setState({ tab })}
        >
          <Tab label={itemsTitle} disabled={journalOnly} />
          <Tab label="Journal Entries" />
        </Tabs>
        { currentTab === 0 &&
          <Container>
            {itemsView}
          </Container>
        }
        { currentTab === 1 &&
          <Container>
            <JournalEntries journal={journal} entries={syncEntries} />
          </Container>
        }
      </React.Fragment>
    );
  }
}

export default withTheme()(Journal);
