// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

export const PrettyError = React.memo((props: any) => (
  <div>
    <pre style={{ fontWeight: "bold" }}>
      {props.error.message}
    </pre>

    <pre>
      {props.error.stack}
    </pre>
  </div>
));

export default PrettyError;
