// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import Color from 'color';

import { Theme, withTheme } from '@material-ui/core/styles';

export default withTheme((props: {text: string, backgroundColor?: string, children?: any, theme: Theme}) => {
  const backgroundColor = props.backgroundColor ?? props.theme.palette.secondary.main;
  const foregroundColor = props.theme.palette.getContrastText(Color(backgroundColor).rgb().string());
  const style = {
    header: {
      backgroundColor,
      color: foregroundColor,
      padding: 15,
    },
    headerText: {
      marginTop: 10,
      marginBottom: 10,
    },
  };

  return (
    <div style={style.header}>
      <h2 style={style.headerText}>{props.text}</h2>
      {props.children}
    </div>
  );
});
