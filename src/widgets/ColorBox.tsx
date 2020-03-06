// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

interface PropsType {
  color: string;
  size?: number | string;
  style?: React.CSSProperties;
}

export default function ColorBox(props: PropsType) {
  const size = props.size ?? 64;
  const style = { ...props.style, backgroundColor: props.color, width: size, height: size };
  return (
    <div style={style} />
  );
}