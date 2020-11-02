// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";

import { ContactType } from "../pim-types";

import Sidebar from "./Sidebar";
import Toolbar from "./Toolbar";
import AddressBook from "./AddressBook";

const useStyles = makeStyles((theme) => ({
  topBar: {
    backgroundColor: theme.palette.primary[500],
  },
}));

interface PropsType {
  entries: ContactType[];
  onItemClick: (contact: ContactType) => void;
  onNewGroupClick: () => void;
}

export default function SearchableAddressBook(props: PropsType) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterByGroup, setFilterByGroup] = React.useState<string>();
  const theme = useTheme();
  const classes = useStyles();

  const groups = React.useMemo(
    (() => props.entries.filter((x) => x.group)),
    [props.entries]
  );
  const group = React.useMemo(
    (() => groups.find((x) => x.uid === filterByGroup)),
    [groups, filterByGroup]
  );

  function filterFunc(ent: ContactType) {
    return (
      (!group || (group.members.includes(ent.uid))) &&
      ent.fn?.match(reg)
    );
  }

  const reg = new RegExp(searchQuery, "i");

  return (
    <Grid container spacing={4}>
      <Grid item xs={3} className={classes.topBar}>
        {/* spacer */}
      </Grid>

      <Grid item xs={9} className={classes.topBar}>
        <Toolbar
          searchTerm={searchQuery}
          setSearchTerm={setSearchQuery}
        />
      </Grid>

      <Grid item xs={3} style={{ borderRight: `1px solid ${theme.palette.divider}` }}>
        <Sidebar
          groups={groups}
          filterByGroup={filterByGroup}
          setFilterByGroup={setFilterByGroup}
          newGroup={props.onNewGroupClick}
          editGroup={props.onItemClick}
        />
      </Grid>

      <Grid item xs>
        <Divider style={{ marginTop: "1em" }} />

        <AddressBook filter={filterFunc} {...props} />
      </Grid>
    </Grid>
  );
}
