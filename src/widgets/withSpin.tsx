// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import "./withSpin.css";

const withSpin = (Component: any) => {
  return React.memo((_props: any) => {
    const {
      spin,
      ...props
    } = _props;
    return (
      <Component {...props} className={spin ? "withSpin-spin" : ""} />
    );
  });
};

export default withSpin;
