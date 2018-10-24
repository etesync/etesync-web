import * as React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

export default (props: any) => {
  return (
    <CircularProgress size={60} thickness={7} {...props} />
  );
};
