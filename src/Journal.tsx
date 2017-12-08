import * as React from 'react';
import { Tabs, Tab } from 'material-ui/Tabs';

import * as EteSync from './api/EteSync';

import Container from './Container';

import SecondaryHeader from './SecondaryHeader';

import JournalEntries from './JournalEntries';
import JournalAddressBook from './JournalAddressBook';
import JournalCalendar from './JournalCalendar';
import LoadingIndicator from './LoadingIndicator';

import { syncEntriesToItemMap, syncEntriesToCalendarItemMap } from './journal-processors';

import { JournalsData, EntriesType, CredentialsData } from './store';

interface PropsType {
  journals: JournalsData;
  entries: EntriesType;
  etesync: CredentialsData;
  match: any;
}

interface PropsTypeInner extends PropsType {
}

class Journal extends React.Component {
  static defaultProps = {
    prevUid: null,
  };

  props: PropsTypeInner;

  constructor(props: any) {
    super(props);
  }

  render() {
    const journalUid = this.props.match.params.journalUid;
    const entries = this.props.entries[journalUid];

    if ((!entries) || (entries.value === null)) {
      return (<LoadingIndicator />);
    }

    const journal = this.props.journals.find((x) => (x.uid === journalUid));

    if (journal === undefined) {
      return (<div>Journal not found!</div>);
    }

    const derived = this.props.etesync.encryptionKey;
    let prevUid: string | null = null;
    const cryptoManager = new EteSync.CryptoManager(derived, journal.uid, journal.version);
    const collectionInfo = journal.getInfo(cryptoManager);

    const syncEntries = entries.value.map((entry) => {
      let syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
      prevUid = entry.uid;

      return syncEntry;
    });

    let itemsTitle: string;
    let itemsView: JSX.Element;
    if (collectionInfo.type === 'CALENDAR') {
      itemsView = <JournalCalendar journal={journal} entries={syncEntriesToCalendarItemMap(syncEntries)} />;
      itemsTitle = 'Events';
    } else if (collectionInfo.type === 'ADDRESS_BOOK') {
      itemsView = <JournalAddressBook journal={journal} entries={syncEntriesToItemMap(syncEntries)} />;
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
              <JournalEntries journal={journal} entries={syncEntries} />;
            </Container>
          </Tab>
        </Tabs>
      </React.Fragment>
    );
  }
}

export default Journal;
