import * as React from 'react';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

import { pure } from 'recompose';

export default pure((_props: any) => {
  const {
    children,
    onCancel,
    onOk,
    labelOk,
    ...props
  } = _props;

  return (
    <Dialog
      modal={false}
      onRequestClose={onCancel}
      {...props}
    >
      <DialogContent>
        {children}
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={onOk}
        >
          {labelOk || 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
