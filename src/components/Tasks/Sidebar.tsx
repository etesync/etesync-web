import React from 'react';

import { useSelector, useDispatch } from 'react-redux';

import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { IconProps } from '@material-ui/core/Icon';
import TodayIcon from '@material-ui/icons/Today';
import LabelIcon from '@material-ui/icons/LabelOutlined';

import { setSettings } from '../../store/actions';
import { StoreState } from '../../store';

interface ListItemPropsType {
  name: string;
  Icon?: React.ComponentType<IconProps>;
  primaryText: string;
  secondaryText?: string;
}

const SidebarListItem = (props: ListItemPropsType) => {
  const { name, Icon, primaryText, secondaryText } = props;
  const dispatch = useDispatch();
  const settings = useSelector((state: StoreState) => state.settings.tasks);
  const { filterBy } = settings;

  const handleClick = () => {
    dispatch(setSettings({ tasks: { ...settings, filterBy: name } }));
  };

  return (
    <ListItem
      button
      onClick={handleClick}
      selected={name === filterBy}
    >
      {Icon ?
        <ListItemIcon>
          <Icon fontSize="small" />
        </ListItemIcon> :
        ''
      }
      <ListItemText primary={primaryText} secondary={secondaryText || ''} />
    </ListItem>
  );
};

const Sidebar = (props: { tags: any }) => {
  const { tags } = props;

  const settings = useSelector((state: StoreState) => state.settings.tasks);
  const { filterBy, searchTerm } = settings;

  const tagsList = Object.entries(tags).map(([tag, amount]) => (
    <SidebarListItem
      key={tag}
      name={tag}
      primaryText={tag}
      secondaryText={String(amount)}
      Icon={LabelIcon} />
  ));

  return (
    <List dense>
      {filterBy === 'search' && <SidebarListItem name="search" primaryText={`Search "${searchTerm}"`} />}

      <SidebarListItem name="all" primaryText="View all tasks" />

      <ListSubheader>Filter</ListSubheader>
      <SidebarListItem name="today" primaryText="Today" Icon={TodayIcon} />

      <ListSubheader>Tags</ListSubheader>
      {tagsList}
    </List>
  );
};

export default React.memo(Sidebar);
