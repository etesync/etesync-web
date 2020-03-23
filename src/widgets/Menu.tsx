// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import MuiMenu, { MenuProps } from '@material-ui/core/Menu';
import { PopoverOrigin } from '@material-ui/core/Popover';

const anchorOrigin: PopoverOrigin = {
  vertical: 'bottom',
  horizontal: 'right',
};

const transferOrigin: PopoverOrigin = {
  vertical: 'top',
  horizontal: 'right',
};

export default function Menu(props: MenuProps) {
  return (
    <MuiMenu
      {...props}
      getContentAnchorEl={null}
      anchorOrigin={anchorOrigin}
      transformOrigin={transferOrigin}
    />
  );
}