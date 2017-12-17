import * as React from 'react';
import { pure } from 'recompose';

import './withSpin.css';

const withSpin = (Component: any) => {
  return pure((_props: any) => {
    const {
      spin,
      ...props,
    } = _props;
    return (
      <Component {...props} className={spin ? 'withSpin-spin' : ''} />
    );
  });
};

export default withSpin;
