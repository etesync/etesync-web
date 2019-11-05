import * as React from 'react';

export const ExternalLink = React.memo(({ children, ...props }: any) => (
  <a target="_blank" rel="noopener" {...props}>
    {children}
  </a>
));

export default ExternalLink;
