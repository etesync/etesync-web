import * as React from 'react';

import { createSelector } from 'reselect';

import { List, ListItem } from '../widgets/List';

import { TaskType } from '../pim-types';

const TaskListItem = React.memo((props: { entry: TaskType, onClick: (entry: TaskType) => void }) => {
  const {
    entry,
    onClick,
  } = props;
  const title = entry.title;

  return (
    <ListItem
      primaryText={title}
      onClick={() => onClick(entry)}
    />
  );
});

const sortSelector = createSelector(
  (entries: TaskType[]) => entries,
  (entries) => entries.sort((a, b) => a.title.localeCompare(b.title))
);

interface PropsType {
  entries: TaskType[];
  onItemClick: (entry: TaskType) => void;
}

export default React.memo(function TaskList(props: PropsType) {
  const entries = props.entries.filter((x) => !x.finished);
  const sortedEntries = sortSelector(entries);

  const itemList = sortedEntries.map((entry) => {
    const uid = entry.uid;

    return (
      <TaskListItem
        key={uid}
        entry={entry}
        onClick={props.onItemClick}
      />
    );
  });

  return (
    <List>
      {itemList}
    </List>
  );
});
