// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { createSelector } from 'reselect';

import * as EteSync from 'etesync';

import { List } from '../../widgets/List';

import { TaskType, PimType, TaskTags } from '../../pim-types';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import { Theme, withTheme } from '@material-ui/core/styles';

import { useSelector } from 'react-redux';

import TaskListItem from './TaskListItem';
import QuickAdd from './QuickAdd';
import Sidebar from './Sidebar';

import { StoreState } from '../../store';

const sortSelector = createSelector(
  (entries: TaskType[]) => entries,
  (entries) => entries.sort((a, b) => a.title.localeCompare(b.title))
);

const tagFilters = Object.assign(
  {},
  ...TaskTags.map((tag) => ({
    [tag]: (x: TaskType) => x.tags.includes(tag),
  }))
);

const filters = {
  all: () => true,
  ...tagFilters,
};

interface PropsType {
  entries: TaskType[];
  collections: EteSync.CollectionInfo[];
  onItemClick: (entry: TaskType) => void;
  onItemSave: (item: PimType, journalUid: string, originalItem?: PimType) => Promise<void>;
  theme: Theme;
}

export default React.memo(withTheme(function TaskList(props: PropsType) {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const settings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { filterBy } = settings;

  const entries = props.entries.filter((x) => showCompleted || !x.finished).filter(filters[filterBy]);
  const sortedEntries = sortSelector(entries);

  // counts tags and creates an object with shape { tag: amount }
  // TODO: memoize
  const tags = TaskTags.reduce((obj, tag) => ({ ...obj, [tag]: 0 }), {});
  props.entries.filter((x) => (showCompleted || !x.finished)).forEach((entry) => entry.tags.forEach((tag) => {
    if (Object.prototype.hasOwnProperty.call(tags, tag)) { tags[tag]++ }
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

      <Grid item xs={2} style={{ borderRight: `1px solid ${props.theme.palette.divider}` }}>
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
}));
