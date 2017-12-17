import * as React from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';

import AddressBook from '../components/AddressBook';
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
}

const JournalAddressBook = journalView(AddressBook, Contact);
const PersistCalendar = historyPersistor('Calendar')(Calendar);
const JournalCalendar = journalView(PersistCalendar, Event);

class Journal extends React.PureComponent {
  static defaultProps = {
    prevUid: null,
  };

  props: PropsTypeInner;

  constructor(props: any) {
    super(props);
  }

  render() {
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
    } else {
      itemsView = <div>Unsupported type</div>;
      itemsTitle = 'Items';
    }

    return (
      <React.Fragment>
        <SecondaryHeader text={collectionInfo.displayName} />
        <Tabs>
          <Tab
            label={itemsTitle}
          >
            <Container>
              {itemsView}
            </Container>
          </Tab>
          <Tab
            label="Journal Entries"
          >
            <Container>
              <JournalEntries journal={journal} entries={syncEntries} />
            </Container>
          </Tab>
        </Tabs>
      </React.Fragment>
    );
  }
}

export default Journal;
