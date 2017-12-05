import * as React from 'react';
const Fragment = (React as any).Fragment;
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Tabs, Tab } from 'material-ui/Tabs';

import { EteSyncContextType } from './EteSyncContext';
import * as EteSync from './api/EteSync';

import JournalViewEntries from './JournalViewEntries';
import JournalViewAddressBook from './JournalViewAddressBook';
import JournalViewCalendar from './JournalViewCalendar';

import * as store from './store';

interface PropsType {
  etesync: EteSyncContextType;
  match: any;
}

interface PropsTypeInner extends PropsType {
  journals: store.JournalsType;
  entries: store.EntriesType;
}

function fetchEntries(etesync: EteSyncContextType, journalUid: string) {
  const credentials = etesync.credentials;
  const apiBase = etesync.serviceApiUrl;

  return (dispatch: any) => {
    const prevUid = null;
    dispatch(store.entriesRequest(journalUid));

    let entryManager = new EteSync.EntryManager(credentials, apiBase, journalUid);
    entryManager.list(prevUid).then(
      (entries) => {
        dispatch(store.entriesSuccess(journalUid, entries));
      },
      (error) => {
        dispatch(store.entriesFailure(journalUid, error));
      }
    );
  };
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

    store.store.dispatch(fetchEntries(this.props.etesync, journal));
  }

  render() {
    const journalUid = this.props.match.params.journalUid;
    const entries = this.props.entries[journalUid];

    (window as any).me = this.props.entries;
    if ((this.props.journals.value === null) ||
      (!entries) || (entries.value === null)) {
      return (<div>Loading</div>);
    }

    const journal = this.props.journals.value.find((x) => (x.uid === journalUid));

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
      <Fragment>
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
      </Fragment>
    );
  }
}

const mapStateToProps = (state: store.StoreState, props: PropsType) => {
  return {
    journals: state.cache.journals,
    entries: state.cache.entries,
  };
};

export default withRouter(connect(
  mapStateToProps
)(JournalView));
