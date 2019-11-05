import * as React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { Theme, withTheme } from '@material-ui/core/styles';
import IconEdit from '@material-ui/icons/Edit';
import IconMembers from '@material-ui/icons/People';
import IconImport from '@material-ui/icons/ImportExport';

import SearchableAddressBook from '../components/SearchableAddressBook';
import Contact from '../components/Contact';
import Calendar from '../components/Calendar';
import Event from '../components/Event';
import Task from '../components/Task';
import TaskList from '../components/TaskList';

import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';

import JournalEntries from '../components/JournalEntries';
import journalView from './journalView';
import ImportDialog from './ImportDialog';

import { syncEntriesToItemMap, syncEntriesToEventItemMap, syncEntriesToTaskItemMap } from '../journal-processors';

import { SyncInfo, SyncInfoJournal } from '../SyncGate';

import { Link } from 'react-router-dom';

import { routeResolver } from '../App';
import { historyPersistor } from '../persist-state-history';

import { CredentialsData, UserInfoData } from '../store';

interface PropsType {
  etesync: CredentialsData;
  userInfo: UserInfoData;
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
const JournalTaskList = journalView(TaskList, Task);

class Journal extends React.Component<PropsTypeInner> {
  public state: {
    tab: number;
    importDialogOpen: boolean;
  };

  constructor(props: PropsTypeInner) {
    super(props);

    this.importDialogToggle = this.importDialogToggle.bind(this);
    this.state = {
      tab: 0,
      importDialogOpen: false,
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
    } else if (collectionInfo.type === 'TASKS') {
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
                {...{ to: routeResolver.getRoute('journals._id.edit', { journalUid: journal.uid }) }}
              >
                <IconEdit />
              </IconButton>
              <IconButton
                component={Link}
                title="Members"
                {...{ to: routeResolver.getRoute('journals._id.members', { journalUid: journal.uid }) }}
              >
                <IconMembers />
              </IconButton>
            </>
          }
          <IconButton
            title="Import"
            onClick={this.importDialogToggle}
          >
            <IconImport />
          </IconButton>
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

        <ImportDialog
          etesync={this.props.etesync}
          userInfo={this.props.userInfo}
          syncJournal={this.props.syncJournal}
          open={this.state.importDialogOpen}
          onClose={this.importDialogToggle}
        />
      </React.Fragment>
    );
  }

  private importDialogToggle() {
    this.setState((state: any) => ({ importDialogOpen: !state.importDialogOpen }));
  }
}

export default withTheme()(Journal);
