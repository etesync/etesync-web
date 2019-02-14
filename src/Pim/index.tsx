import * as React from 'react';
import { Route, Switch } from 'react-router';
import Button from '@material-ui/core/Button';
import IconEdit from '@material-ui/icons/Edit';
import IconChangeHistory from '@material-ui/icons/ChangeHistory';
import { withStyles } from '@material-ui/core/styles';

import { RouteComponentProps, withRouter } from 'react-router';

import { Action } from 'redux-actions';

import * as EteSync from '../api/EteSync';

import { createSelector } from 'reselect';
import { pure } from 'recompose';

import { History } from 'history';

import { PimType, ContactType, EventType, TaskType } from '../pim-types';

import Container from '../widgets/Container';

import JournalEntries from '../components/JournalEntries';
import ContactEdit from '../components/ContactEdit';
import Contact from '../components/Contact';
import EventEdit from '../components/EventEdit';
import Event from '../components/Event';
import TaskEdit from '../components/TaskEdit';
import Task from '../components/Task';
import PimMain from './PimMain';

import { routeResolver } from '../App';

import { store, CredentialsData, UserInfoData } from '../store';
import { fetchEntries } from '../store/actions';

import { SyncInfo } from '../SyncGate';

import { createJournalEntry } from '../etesync-helpers';

import { syncEntriesToItemMap, syncEntriesToEventItemMap, syncEntriesToTaskItemMap } from '../journal-processors';

function objValues(obj: any) {
  return Object.keys(obj).map((x) => obj[x]);
}

const itemsSelector = createSelector(
  (props: {syncInfo: SyncInfo}) => props.syncInfo,
  (syncInfo) => {
    let collectionsAddressBook: Array<EteSync.CollectionInfo> = [];
    let collectionsCalendar: Array<EteSync.CollectionInfo> = [];
    let collectionsTaskList: Array<EteSync.CollectionInfo> = [];
    let addressBookItems: {[key: string]: ContactType} = {};
    let calendarItems: {[key: string]: EventType} = {};
    let taskListItems: {[key: string]: TaskType} = {};
    syncInfo.forEach(
      (syncJournal) => {
        const syncEntries = syncJournal.entries;

        const collectionInfo = syncJournal.collection;

        if (collectionInfo.type === 'ADDRESS_BOOK') {
          addressBookItems = syncEntriesToItemMap(collectionInfo, syncEntries, addressBookItems);
          collectionsAddressBook.push(collectionInfo);
        } else if (collectionInfo.type === 'CALENDAR') {
          calendarItems = syncEntriesToEventItemMap(collectionInfo, syncEntries, calendarItems);
          collectionsCalendar.push(collectionInfo);
        } else if (collectionInfo.type === 'TASKS') {
          taskListItems = syncEntriesToTaskItemMap(collectionInfo, syncEntries, taskListItems);
          collectionsTaskList.push(collectionInfo);
        }
      }
    );

    return {
      collectionsAddressBook, collectionsCalendar, collectionsTaskList, addressBookItems, calendarItems, taskListItems
    };
  },
);

const ItemChangeLog = pure((props: any) => {
  const {
    syncInfo,
    items,
    uid,
  } = props;

  const journalItem = syncInfo.get(items[uid].journalUid);

  return (
    <React.Fragment>
      <h2>Item Change History</h2>
      <JournalEntries
        journal={journalItem.journal}
        entries={journalItem.entries}
        uid={uid}
      />
    </React.Fragment>
  );
});

type CollectionRoutesPropsType = RouteComponentProps<{}> & {
  syncInfo: SyncInfo,
  routePrefix: string,
  collections: Array<EteSync.CollectionInfo>,
  componentEdit: any,
  componentView: any,
  items: {[key: string]: PimType},
  onItemSave: (item: PimType, journalUid: string, originalContact?: PimType) => void;
  onItemDelete: (item: PimType, journalUid: string) => void;
  onItemCancel: () => void;
  classes: any;
};

const styles = (theme: any) => ({
  button: {
    marginLeft: theme.spacing.unit,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
});

const CollectionRoutes = withStyles(styles)(withRouter(
  class CollectionRoutesInner extends React.PureComponent<CollectionRoutesPropsType> {
    render() {
      const props = this.props;
      const { classes } = this.props;
      const ComponentEdit = props.componentEdit;
      const ComponentView = props.componentView;

      return (
        <Switch>
          <Route
            path={routeResolver.getRoute(props.routePrefix + '.new')}
            exact={true}
            render={({match}) => (
              <Container style={{maxWidth: '30rem'}}>
                <ComponentEdit
                  collections={props.collections}
                  onSave={props.onItemSave}
                  onCancel={props.onItemCancel}
                />
              </Container>
            )}
          />
          <Route
            path={routeResolver.getRoute(props.routePrefix + '._id.edit')}
            exact={true}
            render={({match}) => (
              <Container style={{maxWidth: '30rem'}}>
                {(match.params.itemUid in props.items) &&
                  <ComponentEdit
                    initialCollection={(props.items[match.params.itemUid] as any).journalUid}
                    item={props.items[match.params.itemUid]}
                    collections={props.collections}
                    onSave={props.onItemSave}
                    onDelete={props.onItemDelete}
                    onCancel={props.onItemCancel}
                  />
                }
              </Container>
            )}
          />
          <Route
            path={routeResolver.getRoute(props.routePrefix + '._id.log')}
            exact={true}
            render={({match}) => (
              <Container>
                <ItemChangeLog
                  syncInfo={props.syncInfo}
                  items={props.items}
                  uid={match.params.itemUid}
                />
              </Container>
            )}
          />
          <Route
            path={routeResolver.getRoute(props.routePrefix + '._id')}
            exact={true}
            render={({match, history}) => (
              <Container>
                <div style={{textAlign: 'right', marginBottom: 15}}>
                  <Button
                    variant="contained"
                    className={classes.button}
                    onClick={() =>
                      history.push(routeResolver.getRoute(
                        props.routePrefix + '._id.log',
                        {itemUid: match.params.itemUid}))
                    }
                  >
                   <IconChangeHistory className={classes.leftIcon} />
                   Change History
                  </Button>

                  <Button
                    color="secondary"
                    variant="contained"
                    disabled={!props.componentEdit}
                    className={classes.button}
                    style={{marginLeft: 15}}
                    onClick={() =>
                      history.push(routeResolver.getRoute(
                        props.routePrefix + '._id.edit',
                        {itemUid: match.params.itemUid}))
                    }
                  >
                    <IconEdit className={classes.leftIcon} />
                    Edit
                  </Button>
                </div>
                <ComponentView item={props.items[match.params.itemUid]} />
              </Container>
            )}
          />
        </Switch>
      );
    }
  }
));

class Pim extends React.PureComponent {
  props: {
    etesync: CredentialsData;
    userInfo: UserInfoData;
    syncInfo: SyncInfo;
    history: History;
  };

  constructor(props: any) {
    super(props);
    this.onCancel = this.onCancel.bind(this);
    this.onItemDelete = this.onItemDelete.bind(this);
    this.onItemSave = this.onItemSave.bind(this);
  }

  onItemSave(item: PimType, journalUid: string, originalEvent?: PimType) {
    const syncJournal = this.props.syncInfo.get(journalUid);

    if (syncJournal === undefined) {
      return;
    }

    const journal = syncJournal.journal;

    let action = (originalEvent === undefined) ? EteSync.SyncEntryAction.Add : EteSync.SyncEntryAction.Change;

    let prevUid: string | null = null;
    let last = syncJournal.journalEntries.last() as EteSync.Entry;
    if (last) {
      prevUid = last.uid;
    }
    store.dispatch<any>(fetchEntries(this.props.etesync, journal.uid, prevUid))
      .then((entriesAction: Action<EteSync.Entry[]>) => {

      last = entriesAction.payload!.slice(-1).pop() as EteSync.Entry;

      if (last) {
        prevUid = last.uid;
      }

      const saveEvent = store.dispatch(
        createJournalEntry(
          this.props.etesync, this.props.userInfo, journal,
          prevUid, action, item.toIcal()));
      (saveEvent as any).then(() => {
        this.props.history.goBack();
      });
    });
  }

  onItemDelete(item: PimType, journalUid: string) {
    const syncJournal = this.props.syncInfo.get(journalUid);

    if (syncJournal === undefined) {
      return;
    }

    const journal = syncJournal.journal;

    let action = EteSync.SyncEntryAction.Delete;

    let prevUid: string | null = null;
    let last = syncJournal.journalEntries.last() as EteSync.Entry;
    if (last) {
      prevUid = last.uid;
    }
    store.dispatch<any>(fetchEntries(this.props.etesync, journal.uid, prevUid))
      .then((entriesAction: Action<EteSync.Entry[]>) => {

      last = entriesAction.payload!.slice(-1).pop() as EteSync.Entry;

      if (last) {
        prevUid = last.uid;
      }

      const deleteItem = store.dispatch(
        createJournalEntry(
          this.props.etesync, this.props.userInfo, journal,
          prevUid, action, item.toIcal()));
      (deleteItem as any).then(() => {
        this.props.history.push(routeResolver.getRoute('pim'));
      });
    });
  }

  onCancel() {
    this.props.history.goBack();
  }

  render() {
    const { collectionsAddressBook, collectionsCalendar, collectionsTaskList, addressBookItems, calendarItems, taskListItems } = itemsSelector(this.props);

    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('pim')}
          exact={true}
          render={({history}) => (
            <PimMain
              contacts={objValues(addressBookItems)}
              events={objValues(calendarItems)}
              tasks={objValues(taskListItems)}
              history={history}
            />
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.contacts')}
          render={() => (
            <CollectionRoutes
              syncInfo={this.props.syncInfo}
              routePrefix="pim.contacts"
              collections={collectionsAddressBook}
              items={addressBookItems}
              componentEdit={ContactEdit}
              componentView={Contact}
              onItemSave={this.onItemSave}
              onItemDelete={this.onItemDelete}
              onItemCancel={this.onCancel}
            />
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.events')}
          render={() => (
            <CollectionRoutes
              syncInfo={this.props.syncInfo}
              routePrefix="pim.events"
              collections={collectionsCalendar}
              items={calendarItems}
              componentEdit={EventEdit}
              componentView={Event}
              onItemSave={this.onItemSave}
              onItemDelete={this.onItemDelete}
              onItemCancel={this.onCancel}
            />
          )}
        />
        <Route
          path={routeResolver.getRoute('pim.tasks')}
          render={() => (
            <CollectionRoutes
              syncInfo={this.props.syncInfo}
              routePrefix="pim.tasks"
              collections={collectionsTaskList}
              items={taskListItems}
              componentEdit={TaskEdit}
              componentView={Task}
              onItemSave={this.onItemSave}
              onItemDelete={this.onItemDelete}
              onItemCancel={this.onCancel}
            />
          )}
        />
      </Switch>
    );
  }
}

export default Pim;
