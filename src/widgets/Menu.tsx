// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import MuiMenu from '@material-ui/core/Menu';
import { PopoverOrigin } from '@material-ui/core/Popover';

const anchorOrigin: PopoverOrigin = {
  vertical: 'bottom',
  horizontal: 'right',
};

const transferOrigin: PopoverOrigin = {
  vertical: 'top',
  horizontal: 'right',
};

interface PropsType {
  anchorEl?: Element | ((element: Element) => Element) | null | undefined;
  keepMounted?: boolean;
  open: boolean;
  onClose: ((event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void);
  children?: React.ReactNode | React.ReactNode[];
}

export default function Menu(props: PropsType) {
  const { anchorEl, keepMounted, open, onClose, children } = props;

  return (
    <MuiMenu
      anchorEl={anchorEl}
      keepMounted={keepMounted}
      open={open}
      onClose={onClose}
      getContentAnchorEl={null}
      anchorOrigin={anchorOrigin}
      transformOrigin={transferOrigin}
    >
      {children}
    </MuiMenu>
  );
}