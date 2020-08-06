// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import ColorBox from "./ColorBox";
import { TextField, ButtonBase } from "@material-ui/core";

interface PropsType {
  color: string;
  defaultColor: string;
  label?: string;
  placeholder?: string;
  error?: string;
  onChange: (color: string) => void;
}


export default function ColorPicker(props: PropsType) {
  const colors = [
    [
      "#F44336",
      "#E91E63",
      "#673AB7",
      "#3F51B5",
      "#2196F3",
    ],
    [
      "#03A9F4",
      "#4CAF50",
      "#8BC34A",
      "#FFEB3B",
      "#FF9800",
    ],
  ];
  const color = props.color;

  return (
    <div>
      {colors.map((colorGroup, idx) => (
        <div key={idx} style={{ flex: 1, flexDirection: "row", justifyContent: "space-between" }}>
          {colorGroup.map((colorOption) => (
            <ButtonBase
              style={{ margin: 5, borderRadius: 36 / 2 }}
              key={colorOption}
              onClick={() => props.onChange(colorOption)}
            >
              <ColorBox size={36} style={{ borderRadius: 36 / 2 }} color={colorOption} />
            </ButtonBase>
          ))}
        </div>
      ))}
      <div style={{ flex: 1, alignItems: "center", flexDirection: "row", margin: 5 }}>
        <ColorBox
          style={{ display: "inline-block" }}
          size={36}
          color={color}
        />
        <TextField
          style={{ marginLeft: 10, flex: 1 }}
          error={!!props.error}
          onChange={(event: React.FormEvent<{ value: string }>) => props.onChange(event.currentTarget.value)}
          placeholder={props.placeholder ?? "E.g. #aabbcc"}
          label={props.label ?? "Color"}
          value={color}
          helperText={props.error}
        />
      </div>
    </div>
  );
}
