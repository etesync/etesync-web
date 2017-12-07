import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Tabs, Tab } from 'material-ui/Tabs';

import * as EteSync from './api/EteSync';

import JournalViewEntries from './JournalViewEntries';
import JournalViewAddressBook from './JournalViewAddressBook';
import JournalViewCalendar from './JournalViewCalendar';
import LoadingIndicator from './LoadingIndicator';

import { store, StoreState, JournalsData, EntriesType, CredentialsData, fetchEntries } from './store';

interface PropsType {
  journals: JournalsData;
  etesync: CredentialsData;
  match: any;
}

interface PropsTypeInner extends PropsType {
  entries: EntriesType;
}

class JournalView extends React.Component {
  static defaultProps = {
    prevUid: null,
  };

  props: PropsTypeInner;

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    const journal = this.props.match.params.journalUid;

    store.dispatch(fetchEntries(this.props.etesync, journal, null));
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
      itemsView = <JournalViewCalendar journal={journal} entries={syncEntries} />;
      itemsTitle = 'Events';
    } else if (collectionInfo.type === 'ADDRESS_BOOK') {
      itemsView = <JournalViewAddressBook journal={journal} entries={syncEntries} />;
      itemsTitle = 'Contacts';
    } else {
      itemsView = <div>Unsupported type</div>;
      itemsTitle = 'Items';
    }

    return (
      <Tabs>
        <Tab
          label={itemsTitle}
        >
            <h2>{collectionInfo.displayName}</h2>
            {itemsView}
        </Tab>
        <Tab
          label="Journal Entries"
        >
            <h2>{collectionInfo.displayName}</h2>
            <JournalViewEntries journal={journal} entries={syncEntries} />;
        </Tab>
      </Tabs>
    );
  }
}

const mapStateToProps = (state: StoreState, props: PropsType) => {
  return {
    entries: state.cache.entries,
  };
};

export default withRouter(connect(
  mapStateToProps
)(JournalView));
