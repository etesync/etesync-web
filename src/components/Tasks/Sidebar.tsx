import * as React from 'react';

import { useSelector, useDispatch } from 'react-redux';

import InboxIcon from '@material-ui/icons/Inbox';
import LabelIcon from '@material-ui/icons/LabelOutlined';
import TodayIcon from '@material-ui/icons/Today';
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider';

import { setSettings } from '../../store/actions';
import { StoreState } from '../../store';

import { List, ListItem, ListSubheader } from '../../widgets/List';
import { TaskType } from '../../pim-types';

interface ListItemPropsType {
  name: string | null;
  icon?: React.ReactElement;
  primaryText: string;
  amount: number;
}

function SidebarListItem(props: ListItemPropsType) {
  const { name, icon, primaryText, amount } = props;
  const dispatch = useDispatch();
  const taskSettings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { filterBy } = taskSettings;

  const handleClick = () => {
    dispatch(setSettings({ taskSettings: { ...taskSettings, filterBy: name } }));
  };

  return (
    <ListItem
      onClick={handleClick}
      selected={name === filterBy}
      leftIcon={icon}
      rightIcon={<span style={{ width: '100%', textAlign: 'right' }}>{(amount > 0) && amount}</span>}
      primaryText={primaryText}
    />
  );
}

function ToggleCompleted() {
  const dispatch = useDispatch();
  const taskSettings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { showCompleted } = taskSettings;

  const handleChange = (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    dispatch(setSettings({ taskSettings: { ...taskSettings, showCompleted: checked } }));
  };

  return (
    <ListItem
      primaryText="Completed"
      leftIcon={<Switch edge="start" checked={showCompleted} onChange={handleChange} />}
    />
  );
}

export default React.memo(function Sidebar(props: { tasks: TaskType[] }) {
  const { tasks } = props;

  const amountDueToday = tasks.filter((x) => x.dueToday).length;

  const tags = new Map<string, number>();
  tasks.forEach((task) => task.tags.forEach((tag) => {
    tags.set(tag, (tags.get(tag) ?? 0) + 1);
  }));

  const tagsList = [...tags].sort(([a], [b]) => a.localeCompare(b)).map(([tag, amount]) => (
    <SidebarListItem
      key={tag}
      name={`tag:${tag}`}
      primaryText={tag}
      icon={<LabelIcon />}
      amount={amount}
    />
  ));

  return (
    <List>
      <SidebarListItem name={null} primaryText="All" icon={<InboxIcon />} amount={tasks.length} />
      <SidebarListItem name="today" primaryText="Due today" icon={<TodayIcon />} amount={amountDueToday} />

      <ListSubheader>Tags</ListSubheader>
      {tagsList}

      <Divider style={{ marginTop: '1em', marginBottom: '1em' }} />

      <ToggleCompleted />
    </List>
  );
});