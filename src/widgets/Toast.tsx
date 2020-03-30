import * as React from 'react';

import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';

interface PropsType {
  open: boolean;
  children: React.ReactNode;
}

export default function Toast(props: PropsType) {
  const { open, children } = props;

  return (
    <Snackbar open={open}>
      <Alert severity="error" variant="filled" elevation={6}>
        {children}
      </Alert>
    </Snackbar>
  );
}