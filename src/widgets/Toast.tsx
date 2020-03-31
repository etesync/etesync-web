// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';

interface PropsType {
  open: boolean;
  children: React.ReactNode;
  onClose?: (event?: React.SyntheticEvent, reason?: string) => void;
}

export default function Toast(props: PropsType) {
  const { open, children, onClose } = props;

  return (
    <Snackbar open={open} onClose={onClose}>
      <Alert severity="error" variant="filled" elevation={6} onClose={onClose}>
        {children}
      </Alert>
    </Snackbar>
  );
}