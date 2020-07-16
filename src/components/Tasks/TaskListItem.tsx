// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { TaskType, TaskPriorityType } from '../../pim-types';
import { ListItem } from '../../widgets/List';

import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import * as colors from '@material-ui/core/colors';
import Chip from '@material-ui/core/Chip';

import { mapPriority, formatDate } from '../../helpers';

const checkboxColor = {
  [TaskPriorityType.Undefined]: colors.grey[600],
  [TaskPriorityType.Low]: colors.blue[600],
  [TaskPriorityType.Medium]: colors.orange[600],
  [TaskPriorityType.High]: colors.red[600],
};

const TagsList = React.memo((props: { tags: string[] }) => (
  <ul>
    {props.tags.map((tag, i) => tag && <Chip
      key={i}
      color="secondary"
      size="small"
      label={tag}
      style={{ marginRight: '0.75em' }}
      component="li"
    />)}
  </ul>));

interface PropsType {
  entry: TaskType;
  nestedItems?: React.ReactNode[];
  onClick: (task: TaskType) => void;
  onToggleComplete: (task: TaskType, completed: boolean) => void;
}

export default React.memo(function TaskListItem(props: PropsType) {
  const {
    entry: task,
    nestedItems,
    onClick,
    onToggleComplete,
  } = props;
  const title = task.title;

  const dueDateText = task.dueDate ? `Due ${formatDate(task.dueDate)}` : '';
  const freqText = task.rrule ? `(repeats ${task.rrule.freq.toLowerCase()})` : '';
  const secondaryText = `${dueDateText} ${freqText}`;

  return (
    <ListItem
      primaryText={title}
      secondaryText={secondaryText}
      secondaryTextColor={task.overdue ? 'error' : 'textSecondary'}
      nestedItems={nestedItems}
      onClick={() => onClick(task)}
      leftIcon={
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          onChange={(_e, checked) => onToggleComplete(task, checked)}
          checked={task.finished}
          icon={<CheckBoxOutlineBlankIcon style={{ color: checkboxColor[mapPriority(task.priority)] }} />}
        />
      }
      rightIcon={<TagsList tags={task.tags} />}
    />
  );
});
