// SPDX-FileCopyrightText: © 2020 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Tabs, Tab, useTheme } from "@material-ui/core";
import { useHistory } from "react-router";
import { routeResolver } from "../App";

export type TabValue = "contacts" | "events" | "tasks";

interface PropsType {
  value: TabValue;
}

export default function PimNavigationTabs(props: PropsType) {
  const theme = useTheme();
  const history = useHistory();

  const tabs = [
    { title: "Address Book", linkValue: "contacts" },
    { title: "Calendar", linkValue: "events" },
    { title: "Tasks", linkValue: "tasks" },
  ];

  let selected;
  switch (props.value) {
    case "contacts": {
      selected = 0;
      break;
    }
    case "events": {
      selected = 1;
      break;
    }
    case "tasks": {
      selected = 2;
      break;
    }
  }

  return (
    <Tabs
      variant="fullWidth"
      style={{ backgroundColor: theme.palette.primary.main }}
      value={selected}
      onChange={(_event, value) => history.push(
        routeResolver.getRoute(`pim.${tabs[value].linkValue}`)
      )}
    >
      {tabs.map((x) => (
        <Tab
          key={x.linkValue}
          label={x.title}
        />
      ))}
    </Tabs>
  );
}
