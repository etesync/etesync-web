import * as React from 'react';
import { pure } from 'recompose';

export const ExternalLink = pure((props: any) => (
  <a target="_blank" {...props} />
));

export default ExternalLink;
