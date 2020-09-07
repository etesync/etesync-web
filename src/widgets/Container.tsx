// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import Paper from "@material-ui/core/Paper";

import "./Container.css";

export default (props: {style?: React.CSSProperties, children: any}) => {
  const display = props.style?.display;
  const flexDirection = props.style?.flexDirection;

  return (
    <div className="Container" style={props.style}>
      <Paper elevation={3} style={{ display, flexDirection, flexGrow: 1 }}>
        <div className="Container-inner" style={{ display, flexDirection, flexGrow: 1 }}>
          {props.children}
        </div>
      </Paper>
    </div>
  );
};
