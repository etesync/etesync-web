// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { TaskType, TaskStatusType, PimType } from '../../pim-types';
import { ListItem } from '../../widgets/List';

import Checkbox from '@material-ui/core/Checkbox';

interface PropsType {
  entry: TaskType;
  onClick: (task: TaskType) => void;
  onSave: (item: PimType, journalUid: string, originalItem?: PimType) => Promise<void>;
}

const TaskListItem = React.memo((props: PropsType) => {
  const {
    entry: task,
    onClick,
    onSave: save,
  } = props;
  const title = task.title;

  function toggleComplete(_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) {
    const clonedTask = task.clone();
    clonedTask.status = checked ? TaskStatusType.Completed : TaskStatusType.NeedsAction;
    save(clonedTask, (task as any).journalUid, task);
  }

  return (
    <ListItem
      primaryText={title}
      onClick={() => onClick(task)}
      leftIcon={
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          onChange={toggleComplete}
          checked={task.finished}
        />
      }
    />
  );
});

export default TaskListItem;