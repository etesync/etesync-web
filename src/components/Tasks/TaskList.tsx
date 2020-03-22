// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import * as EteSync from 'etesync';

import { List } from '../../widgets/List';

import { TaskType, PimType } from '../../pim-types';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';

import { useSelector } from 'react-redux';

import TaskListItem from './TaskListItem';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';

import { StoreState } from '../../store';

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
  // Intentionally converts 0/undefined to Infinity to sort to back of the list
  const a = aIn.priority || Infinity;
  const b = bIn.priority || Infinity;
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

interface PropsType {
  entries: TaskType[];
  collections: EteSync.CollectionInfo[];
  onItemClick: (entry: TaskType) => void;
  onItemSave: (item: PimType, journalUid: string, originalItem?: PimType) => Promise<void>;
}

export default function TaskList(props: PropsType) {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const settings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { filterBy, sortBy } = settings;
  const theme = useTheme();

  const potentialEntries = React.useMemo(
    () => props.entries.filter((x) => showCompleted || !x.finished),
    [showCompleted, props.entries]
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

  const sortedEntries = entries.sort(getSortFunction(sortBy));

  const itemList = sortedEntries.map((entry) => {
    const uid = entry.uid;

    return (
      <TaskListItem
        key={uid}
        entry={entry}
        onClick={props.onItemClick}
        onSave={props.onItemSave}
      />
    );
  });

  return (
    <Grid container spacing={4}>

      <Grid item xs={3} style={{ borderRight: `1px solid ${theme.palette.divider}` }}>
        <Sidebar tasks={potentialEntries} />
      </Grid>

      <Grid item xs>
        <Toolbar
          defaultCollection={props.collections?.[0]}
          onItemSave={props.onItemSave}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
        />

        <Divider style={{ marginTop: '1em' }} />
        <List>
          {itemList}
        </List>
      </Grid>
    </Grid>
  );
}
