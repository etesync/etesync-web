// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { TaskType, TaskStatusType, PimType, TaskPriorityType } from '../../pim-types';
import { ListItem } from '../../widgets/List';

import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import * as colors from '@material-ui/core/colors';
import Chip from '@material-ui/core/Chip';

import moment from 'moment';

import { mapPriority } from '../../helpers';

import { useSelector, useDispatch } from 'react-redux';
import { StoreState } from '../../store';
import { setSettings } from '../../store/actions';

const checkboxColor = {
  [TaskPriorityType.Undefined]: colors.grey[600],
  [TaskPriorityType.Low]: colors.blue[600],
  [TaskPriorityType.Medium]: colors.orange[600],
  [TaskPriorityType.High]: colors.red[600],
};

function TagsListItem(props: { tag: string }) {
  const { tag } = props;
  const dispatch = useDispatch();
  const taskSettings = useSelector((state: StoreState) => state.settings.taskSettings);

  function handleClick(e: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    e.stopPropagation();
    dispatch(setSettings({ taskSettings: { ...taskSettings, filterBy: `tag:${tag}` } }));
  }

  return (
    <Chip
      color="secondary"
      size="small"
      label={tag}
      style={{ marginRight: '0.75em' }}
      component="li"
      onClick={handleClick}
    />
  );
}

const TagsList = React.memo((props: { tags: string[] }) => (
  <ul>
    {props.tags.map((tag, i) => <TagsListItem key={i} tag={tag} />)}
  </ul>
));

interface PropsType {
  entry: TaskType;
  onClick: (task: TaskType) => void;
  onSave: (item: PimType, journalUid: string, originalItem?: PimType) => Promise<void>;
}

export default React.memo(function TaskListItem(props: PropsType) {
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
      secondaryText={task.dueDate && `Due ${moment().to(task.dueDate.toJSDate())}`}
      onClick={() => onClick(task)}
      leftIcon={
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          onChange={toggleComplete}
          checked={task.finished}
          icon={<CheckBoxOutlineBlankIcon style={{ color: checkboxColor[mapPriority(task.priority)] }} />}
        />
      }
      rightIcon={<TagsList tags={task.tags} />}
    />
  );
});
