// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import * as EteSync from 'etesync';

import { List } from '../../widgets/List';
import Toast, { PropsType as ToastProps } from '../../widgets/Toast';

import { TaskType, PimType, TaskStatusType } from '../../pim-types';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import { useTheme, makeStyles } from '@material-ui/core/styles';

import { useSelector, useDispatch } from 'react-redux';

import Fuse from 'fuse.js';

import TaskListItem from './TaskListItem';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import QuickAdd from './QuickAdd';

import { StoreState, UserInfoData, CredentialsData } from '../../store';
import { formatDate } from '../../helpers';
import { SyncInfo } from '../../SyncGate';
import { fetchEntries } from '../../store/actions';
import { Action } from 'redux-actions';
import { addJournalEntries } from '../../etesync-helpers';

function sortCompleted(a: TaskType, b: TaskType) {
  return (!!a.finished === !!b.finished) ? 0 : (a.finished) ? 1 : -1;
}

function sortLastModifiedDate(aIn: TaskType, bIn: TaskType) {
  const a = aIn.lastModified?.toJSDate() ?? new Date(0);
  const b = bIn.lastModified?.toJSDate() ?? new Date(0);
  return (a > b) ? -1 : (a < b) ? 1 : 0;
}

function sortDueDate(aIn: TaskType, bIn: TaskType) {
  const impossiblyLargeDate = 8640000000000000;
  const a = aIn.dueDate?.toJSDate() ?? new Date(impossiblyLargeDate);
  const b = bIn.dueDate?.toJSDate() ?? new Date(impossiblyLargeDate);
  return (a < b) ? -1 : (a > b) ? 1 : 0;
}

function sortPriority(aIn: TaskType, bIn: TaskType) {
  // Intentionally converts 0/undefined to 10 (1 more than lowest priority) to sort to back of the list
  const a = aIn.priority || 10;
  const b = bIn.priority || 10;
  return a - b;
}

function sortTitle(aIn: TaskType, bIn: TaskType) {
  const a = aIn.title ?? '';
  const b = bIn.title ?? '';
  return a.localeCompare(b);
}

function getSortFunction(sortOrder: string) {
  const sortFunctions: (typeof sortTitle)[] = [sortCompleted];

  switch (sortOrder) {
    case 'smart':
      sortFunctions.push(sortPriority);
      sortFunctions.push(sortDueDate);
      sortFunctions.push(sortTitle);
      break;
    case 'dueDate':
      sortFunctions.push(sortDueDate);
      break;
    case 'priority':
      sortFunctions.push(sortPriority);
      sortFunctions.push(sortDueDate);
      break;
    case 'title':
      sortFunctions.push(sortTitle);
      break;
    case 'lastModifiedDate':
      // Do nothing because it's the last sort function anyway
      break;
  }

  sortFunctions.push(sortLastModifiedDate);

  return (a: TaskType, b: TaskType) => {
    for (const sortFunction of sortFunctions) {
      const ret = sortFunction(a, b);
      if (ret !== 0) {
        return ret;
      }
    }

    return 0;
  };
}

const useStyles = makeStyles((theme) => ({
  topBar: {
    backgroundColor: theme.palette.primary[500],
  },
}));

interface PropsType {
  entries: TaskType[];
  collections: EteSync.CollectionInfo[];
  onItemClick: (entry: TaskType) => void;
  onItemSave: (item: PimType, journalUid: string, originalItem?: PimType) => Promise<void>;
  syncInfo: SyncInfo;
  userInfo: UserInfoData;
  etesync: CredentialsData;
}

export default function TaskList(props: PropsType) {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [showHidden, setShowHidden] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [toast, setToast] = React.useState<{ message: string, severity: ToastProps['severity'] }>({ message: '', severity: undefined });
  const settings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { filterBy, sortBy } = settings;
  const theme = useTheme();
  const classes = useStyles();
  const dispatch = useDispatch();

  const handleToggleComplete = (task: TaskType, completed: boolean) => {
    const clonedTask = task.clone();
    clonedTask.status = completed ? TaskStatusType.Completed : TaskStatusType.NeedsAction;

    const nextTask = completed ? task.getNextOccurence() : null;

    const syncJournal = props.syncInfo.get((task as any).journalUid);

    if (syncJournal === undefined) {
      setToast({ message: 'Could not sync.', severity: 'error' });
      return;
    }

    const journal = syncJournal.journal;

    let prevUid: string | null = null;
    let last = syncJournal.journalEntries.last() as EteSync.Entry;
    if (last) {
      prevUid = last.uid;
    }

    dispatch<any>(fetchEntries(props.etesync, journal.uid, prevUid))
      .then((entriesAction: Action<EteSync.Entry[]>) => {
        last = entriesAction.payload!.slice(-1).pop() as EteSync.Entry;

        if (last) {
          prevUid = last.uid;
        }

        const changeTask = [EteSync.SyncEntryAction.Change, clonedTask.toIcal()];

        const updates = [];
        updates.push(changeTask as [EteSync.SyncEntryAction, string]);

        if (nextTask) {
          const addNextTask = [EteSync.SyncEntryAction.Add, nextTask.toIcal()];
          updates.push(addNextTask as [EteSync.SyncEntryAction, string]);
        }

        return dispatch(addJournalEntries(props.etesync, props.userInfo, journal, prevUid, updates));
      })
      .then(() => {
        if (nextTask) {
          setToast({ message: `${nextTask.title} rescheduled for ${formatDate(nextTask.startDate ?? nextTask.dueDate)}`, severity: 'success' });
        }
      })
      .catch(() => {
        setToast({ message: 'Failed to save changes. This may be due to a network error.', severity: 'error' });
      });
  };

  const potentialEntries = React.useMemo(
    () => {
      if (searchTerm) {
        const result = new Fuse(props.entries, {
          shouldSort: true,
          threshold: 0.6,
          maxPatternLength: 32,
          minMatchCharLength: 2,
          keys: [
            'title',
            'desc',
          ],
        }).search(searchTerm);
        return result.map((x) => x.item);
      } else {
        return props.entries.filter((x) => (showCompleted || !x.finished) && (showHidden || !x.hidden));
      }
    },
    [showCompleted, props.entries, searchTerm, showHidden]
  );

  let entries;

  const tagPrefix = 'tag:';
  if (filterBy?.startsWith(tagPrefix)) {
    const tag = filterBy.slice(tagPrefix.length);
    entries = potentialEntries.filter((x) => x.tags.includes(tag));
  } else if (filterBy === 'today') {
    entries = potentialEntries.filter((x) => x.dueToday);
  } else {
    entries = potentialEntries;
  }

  const subEntriesMap = new Map<string, TaskType[]>();

  entries = entries.filter((x) => {
    const relatedTo = x.relatedTo;
    if (relatedTo) {
      const cur = subEntriesMap.get(relatedTo) ?? [];
      cur.push(x);
      subEntriesMap.set(relatedTo, cur);
      return false;
    }
    return true;
  });

  const sortedEntries = entries.sort(getSortFunction(sortBy));

  const itemList = sortedEntries.map((entry) => {
    const uid = entry.uid;

    return (
      <TaskListItem
        key={uid}
        entry={entry}
        subEntries={subEntriesMap.get(uid)}
        onClick={props.onItemClick}
        onToggleComplete={(entry: TaskType, completed: boolean) => handleToggleComplete(entry, completed)}
      />
    );
  });

  return (
    <Grid container spacing={4}>
      <Grid item xs={3} className={classes.topBar}>
        {/* spacer */}
      </Grid>

      <Grid item xs={9} className={classes.topBar}>
        <Toolbar
          defaultCollection={props.collections?.[0]}
          onItemSave={props.onItemSave}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showHidden={showHidden}
          setShowHidden={setShowHidden}
        />
      </Grid>

      <Grid item xs={3} style={{ borderRight: `1px solid ${theme.palette.divider}` }}>
        <Sidebar tasks={potentialEntries} />
      </Grid>

      <Grid item xs>

        {props.collections?.[0] && <QuickAdd style={{ flexGrow: 1, marginRight: '0.75em' }} onSubmit={props.onItemSave} defaultCollection={props.collections?.[0]} />}

        <Divider style={{ marginTop: '1em' }} />

        <List>
          {itemList}
        </List>
      </Grid>

      <Toast open={!!toast.message} severity={toast.severity} onClose={() => setToast({ message: '', severity: undefined })} autoHideDuration={3000}>
        {toast.message}
      </Toast>
    </Grid>
  );
}
