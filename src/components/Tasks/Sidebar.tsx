import * as React from 'react';

import { useSelector, useDispatch } from 'react-redux';

import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { IconProps } from '@material-ui/core/Icon';
import LabelIcon from '@material-ui/icons/LabelOutlined';

import { setSettings } from '../../store/actions';
import { StoreState } from '../../store';

interface ListItemPropsType {
  name: string | null;
  Icon?: React.ComponentType<IconProps>;
  primaryText: string;
  secondaryText?: string;
}

function SidebarListItem(props: ListItemPropsType) {
  const { name, Icon, primaryText, secondaryText } = props;
  const dispatch = useDispatch();
  const taskSettings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { filterBy } = taskSettings;

  const handleClick = () => {
    dispatch(setSettings({ taskSettings: { ...taskSettings, filterBy: name } }));
  };

  return (
    <ListItem
      button
      onClick={handleClick}
      selected={name === filterBy}
    >
      {Icon && (
        <ListItemIcon>
          <Icon fontSize="small" />
        </ListItemIcon>
      )}
      <ListItemText primary={primaryText} secondary={secondaryText ?? ''} />
    </ListItem>
  );
}

export default function Sidebar(props: { tags: Map<string, number> }) {
  const { tags } = props;

  const tagsList = Array.from(tags, ([tag, amount]) => (
    <SidebarListItem
      key={tag}
      name={`tag ${tag}`}
      primaryText={tag}
      secondaryText={String(amount)}
      Icon={LabelIcon} />
  ));

  return (
    <List dense>
      <SidebarListItem name={null} primaryText="View all tasks" />

      <ListSubheader>Tags</ListSubheader>
      {tagsList}
    </List>
  );
}