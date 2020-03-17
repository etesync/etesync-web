import * as React from 'react';

import { useSelector, useDispatch } from 'react-redux';

import InboxIcon from '@material-ui/icons/Inbox';
import LabelIcon from '@material-ui/icons/LabelOutlined';

import { setSettings } from '../../store/actions';
import { StoreState } from '../../store';

import { List, ListItem, ListSubheader } from '../../widgets/List';

interface ListItemPropsType {
  name: string | null;
  icon?: React.ReactElement;
  primaryText: string;
  amount?: number;
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
      rightIcon={<span style={{ width: '100%', textAlign: 'right' }}>{amount}</span>}
      primaryText={primaryText}
    />
  );
}

export default function Sidebar(props: { tags: Map<string, number>, totalTasks: number }) {
  const { tags, totalTasks } = props;

  const tagsList = [...tags].sort(([a], [b]) => a < b ? -1 : 1).map(([tag, amount]) => (
    <SidebarListItem
      key={tag}
      name={`tag:${tag}`}
      primaryText={tag}
      icon={<LabelIcon />}
      amount={amount}
    />
  ));

  return (
    <List dense>
      <SidebarListItem name={null} primaryText="All" icon={<InboxIcon />} amount={totalTasks} />

      <ListSubheader>Tags</ListSubheader>
      {tagsList}
    </List>
  );
}