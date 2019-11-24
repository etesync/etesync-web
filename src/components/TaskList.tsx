import * as React from 'react';

import { createSelector } from 'reselect';

import { List, ListItem } from '../widgets/List';

import { TaskType } from '../pim-types';

const TaskListItem = React.memo((_props: any) => {
  const {
    entry,
    onClick,
  } = _props;
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

class TaskList extends React.PureComponent {
  public props: {
    entries: TaskType[];
    onItemClick: (contact: TaskType) => void;
  };

  public render() {
    const entries = this.props.entries.filter((x) => !x.finished);
    const sortedEntries = sortSelector(entries);

    const itemList = sortedEntries.map((entry) => {
      const uid = entry.uid;

      return (
        <TaskListItem
          key={uid}
          entry={entry}
          onClick={this.props.onItemClick}
        />
      );
    });

    return (
      <List>
        {itemList}
      </List>
    );
  }
}

export default TaskList;
