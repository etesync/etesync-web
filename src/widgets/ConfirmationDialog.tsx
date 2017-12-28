import * as React from 'react';

import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

import { pure } from 'recompose';

export default pure((_props: any) => {
  const {
    onCancel,
    onOk,
    ...props,
  } = _props;
  const actions = [
    (
      <FlatButton
        key="1"
        label="Cancel"
        primary={true}
        onClick={onCancel}
      />
    )
    ,
    (
      <FlatButton
        key="2"
        label="Submit"
        primary={true}
        onClick={onOk}
      />
    ),
  ];

  return (
    <Dialog
      actions={actions}
      modal={false}
      onRequestClose={onCancel}
      {...props}
    />
  );
});
