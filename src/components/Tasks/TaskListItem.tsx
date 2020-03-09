import * as React from 'react';

import { TaskType } from '../../pim-types';
import { ListItem } from '../../widgets/List';

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

export default TaskListItem;