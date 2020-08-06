// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import * as Etebase from "etebase";

interface PropsType {
  publicKey: Uint8Array;
}

export default function PrettyFingerprint(props: PropsType) {
  const prettyFingerprint = Etebase.getPrettyFingerprint(props.publicKey);

  return (
    <pre>{prettyFingerprint}</pre>
  );
}
