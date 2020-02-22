import React, { useContext } from 'react';

import moment from 'moment';

import { Chip } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';

import { TaskType, TaskStatusType, TaskPriorityType } from '../../pim-types';
import { ListItem } from '../../widgets/List';
import { PimContext } from '../../Pim';

const TagList = React.memo((props: { tags: string[] }) => (
  <ul>
    {props.tags.map((tag, i) => tag && <Chip
      key={i}
      color="secondary"
      size="small"
      label={tag}
      style={{ marginRight: '10px' }}
      component="li"
    />)}
  </ul>));

// FIXME: HACK the default colors just happen to work, probably want hand-picked colors
const checkboxColor: { [key: number]: 'inherit' | 'secondary' | 'primary' | 'error' } = {
  [TaskPriorityType.None]: 'inherit',
  [TaskPriorityType.Low]: 'secondary',
  [TaskPriorityType.Med]: 'primary',
  [TaskPriorityType.High]: 'error',
};

interface PropsType {
  task: TaskType;
  onClick: (task: TaskType) => void;
}

const TaskListItem = React.memo(
  (props: PropsType) => {
    const { task, onClick } = props;
    const title = task.title;
    const { onItemSave: save } = useContext(PimContext);

    const toggleComplete = (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const clonedTask = task.clone();
      clonedTask.status = checked ? TaskStatusType.Completed : TaskStatusType.NeedsAction;
      save(clonedTask, (task as any).journalUid, task, false);
    };

    return <ListItem
      primaryText={title}
      onClick={() => onClick(task)}
      leftIcon={
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          onChange={toggleComplete}
          checked={task.status === TaskStatusType.Completed}
          icon={<CheckBoxOutlineBlankIcon color={checkboxColor[task.priority]} />}
        />
      }
      rightIcon={<TagList tags={task.categories} />}
      secondaryText={task.dueDate && `Due ${moment().to(task.dueDate.toJSDate())}`}
    />;
  }
);

export default TaskListItem;
