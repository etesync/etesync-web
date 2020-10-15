import * as React from "react";

import InboxIcon from "@material-ui/icons/Inbox";
import LabelIcon from "@material-ui/icons/LabelOutlined";

import { List, ListItem, ListSubheader } from "../widgets/List";
import { ContactType } from "../pim-types";

interface ListItemPropsType {
  name: string | undefined;
  icon?: React.ReactElement;
  primaryText: string;
  filterByGroup: string | undefined;
  setFilterByGroup: (group: string | undefined) => void;
}

function SidebarListItem(props: ListItemPropsType) {
  const { name, icon, primaryText, filterByGroup } = props;

  const handleClick = () => props.setFilterByGroup(name);

  return (
    <ListItem
      onClick={handleClick}
      selected={name === filterByGroup}
      leftIcon={icon}
      primaryText={primaryText}
    />
  );
}

interface PropsType {
  groups: ContactType[];
  filterByGroup: string | undefined;
  setFilterByGroup: (group: string | undefined) => void;
}

export default React.memo(function Sidebar(props: PropsType) {
  const { groups, filterByGroup, setFilterByGroup } = props;

  const groupList = [...groups].sort((a, b) => a.fn.localeCompare(b.fn)).map((group) => (
    <SidebarListItem
      key={group.uid}
      name={group.uid}
      primaryText={group.fn}
      icon={<LabelIcon />}
      filterByGroup={filterByGroup}
      setFilterByGroup={setFilterByGroup}
    />
  ));

  return (
    <List dense>
      <SidebarListItem
        name={undefined}
        primaryText="All"
        icon={<InboxIcon />}
        filterByGroup={filterByGroup}
        setFilterByGroup={setFilterByGroup}
      />

      <ListSubheader>Groups</ListSubheader>
      {groupList}
    </List>
  );
});
