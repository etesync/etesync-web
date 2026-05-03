// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

export const ExternalLink = React.memo(React.forwardRef<HTMLAnchorElement, any>(({ children, ...props }, ref) => (
  <a ref={ref} target="_blank" rel="noopener noreferrer" {...props}>
    {children}
  </a>
)));

export default ExternalLink;
