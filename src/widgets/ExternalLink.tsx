import * as React from 'react';
import { pure } from 'recompose';

export const ExternalLink = pure(({children, ...props}: any) => (
  <a target="_blank" rel="noopener" {...props}>
    {children}
  </a>
));

export default ExternalLink;
