// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

export const ExternalLink = React.memo(({ children, ...props }: any) => (
  <a target="_blank" rel="noopener" {...props}>
    {children}
  </a>
));

export default ExternalLink;
