// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { createSelector } from 'reselect';

import * as EteSync from 'etesync';

import { List } from '../../widgets/List';

import { TaskType, PimType } from '../../pim-types';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';

import { useSelector } from 'react-redux';

import TaskListItem from './TaskListItem';
import QuickAdd from './QuickAdd';
import Sidebar from './Sidebar';

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

export default React.memo(function TaskList(props: PropsType) {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const settings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { filterBy } = settings;
  const theme = useTheme();

  const potentialEntries = props.entries.filter((x) => showCompleted || !x.finished);
  let entries;
  if (filterBy?.startsWith('tag')) {
    const tag = filterBy.slice(4);
    entries = potentialEntries.filter((x) => x.tags.includes(tag));
  } else {
    entries = [...potentialEntries];
  }
  const sortedEntries = sortSelector(entries);

  // TODO: memoize
  const tags = new Map<string, number>();
  potentialEntries.forEach((entry) => entry.tags.forEach((tag) => {
    tags.set(tag, (tags.get(tag) ?? 0) + 1);
  }));

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

      <Grid item xs={2} style={{ borderRight: `1px solid ${theme.palette.divider}` }}>
        <Sidebar tags={tags} />
      </Grid>

      <Grid item xs>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {props.collections && <QuickAdd onSubmit={props.onItemSave} defaultCollection={props.collections[0]} />}

          <FormControlLabel
            control={
              <Checkbox checked={showCompleted} onChange={() => setShowCompleted(!showCompleted)} />
            }
            label="Show Completed"
          />
        </div>

        <Divider style={{ marginTop: '1em' }} />
        <List>
          {itemList}
        </List>
      </Grid>
    </Grid>
  );
});
