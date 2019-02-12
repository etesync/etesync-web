import * as React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { Theme, withTheme } from '@material-ui/core/styles';

import SearchableAddressBook from '../components/SearchableAddressBook';
import Contact from '../components/Contact';
import Calendar from '../components/Calendar';
import Event from '../components/Event';

import Container from '../widgets/Container';

import SecondaryHeader from '../components/SecondaryHeader';

import JournalEntries from '../components/JournalEntries';
import journalView from './journalView';

import { syncEntriesToItemMap, syncEntriesToCalendarItemMap } from '../journal-processors';

import { SyncInfo } from '../SyncGate';

import { match } from 'react-router';

import { historyPersistor } from '../persist-state-history';

interface PropsType {
  syncInfo: SyncInfo;
  match: match<any>;
}

interface PropsTypeInner extends PropsType {
  theme: Theme;
}

const JournalAddressBook = journalView(SearchableAddressBook, Contact);
const PersistCalendar = historyPersistor('Calendar')(Calendar);
const JournalCalendar = journalView(PersistCalendar, Event);

class Journal extends React.PureComponent<PropsTypeInner> {
  state: {
    tab: number,
  };

  constructor(props: PropsTypeInner) {
    super(props);

    this.state = {
      tab: 0,
    };
  }

  render() {
    const { theme } = this.props;
    let currentTab = this.state.tab;
    let journalOnly = false;
    const journalUid = this.props.match.params.journalUid;

    const syncJournal = this.props.syncInfo.get(journalUid);
    if (!syncJournal) {
      return (<div>Journal not found!</div>);
    }

    const journal = syncJournal.journal;
    const collectionInfo = syncJournal.collection;
    const syncEntries = syncJournal.entries;

    let itemsTitle: string;
    let itemsView: JSX.Element;
    if (collectionInfo.type === 'CALENDAR') {
      itemsView =
        <JournalCalendar journal={journal} entries={syncEntriesToCalendarItemMap(collectionInfo, syncEntries)} />;
      itemsTitle = 'Events';
    } else if (collectionInfo.type === 'ADDRESS_BOOK') {
      itemsView =
        <JournalAddressBook journal={journal} entries={syncEntriesToItemMap(collectionInfo, syncEntries)} />;
      itemsTitle = 'Contacts';
    } else if (collectionInfo.type === 'TASKS')  {
      itemsView = <div>Task preview is not yet supported</div>;
      itemsTitle = 'Tasks';
      journalOnly = true;
    } else {
      itemsView = <div>Preview is not supported for this journal type</div>;
      itemsTitle = 'Items';
      journalOnly = true;
    }

    currentTab = journalOnly ? 1 : currentTab;

    return (
      <React.Fragment>
        <SecondaryHeader>{collectionInfo.displayName}</SecondaryHeader>
        <Tabs
          fullWidth={true}
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
