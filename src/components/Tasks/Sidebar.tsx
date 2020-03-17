import * as React from 'react';

import { useSelector, useDispatch } from 'react-redux';

import InboxIcon from '@material-ui/icons/Inbox';
import LabelIcon from '@material-ui/icons/LabelOutlined';
import { makeStyles } from '@material-ui/core/styles';

import { setSettings } from '../../store/actions';
import { StoreState } from '../../store';

import { List, ListItem, ListSubheader } from '../../widgets/List';

const useStyles = makeStyles({
  root: {
    '& .MuiListItemIcon-root': {
      minWidth: '2.5em',
    },
    '& .MuiListItemIcon-root:last-of-type': {
      justifyContent: 'flex-end',
    },
  },
});

interface ListItemPropsType {
  name: string | null;
  icon?: React.ReactElement;
  primaryText: string;
  amount?: number;
}

function SidebarListItem(props: ListItemPropsType) {
  const classes = useStyles();
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
      rightIcon={<span>{amount}</span>}
      primaryText={primaryText}
      customClass={classes.root}
    />
  );
}

export default function Sidebar(props: { tags: Map<string, number> }) {
  const { tags } = props;

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
      <SidebarListItem name={null} primaryText="All" icon={<InboxIcon />} />

      <ListSubheader>Tags</ListSubheader>
      {tagsList}
    </List>
  );
}