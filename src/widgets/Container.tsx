// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import Paper from '@material-ui/core/Paper';

import './Container.css';

export default (props: {style?: any, children: any}) => (
  <div className="Container" style={props.style}>
    <Paper elevation={3}>
      <div className="Container-inner">
        {props.children}
      </div>
    </Paper>
  </div>
);
