// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { createSelector } from 'reselect';

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

const sortSelector = createSelector(
  (entries: TaskType[]) => entries,
  (entries) => entries.sort((a, b) => a.title.localeCompare(b.title))
);

interface PropsType {
  entries: TaskType[];
  collections: EteSync.CollectionInfo[];
  onItemClick: (entry: TaskType) => void;
  onItemSave: (item: PimType, journalUid: string, originalItem?: PimType) => Promise<void>;
}

export default function TaskList(props: PropsType) {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const settings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { filterBy } = settings;
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

  const sortedEntries = sortSelector(entries);

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
