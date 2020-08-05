// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

export default React.memo((_props: any) => {
  const {
    title,
    children,
    onCancel,
    onOk,
    labelOk,
    ...props
  } = _props;

  return (
    <Dialog
      onClose={onCancel}
      {...props}
    >
      <DialogTitle>
        {title}
      </DialogTitle>
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
          {labelOk || "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
