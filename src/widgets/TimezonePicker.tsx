// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";

import * as zones from "../data/zones.json";
const zonelist = Object.keys(zones.zones).sort();

interface PropsType {
  value: string | null;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

export default React.memo(function TimezonePicker(props: PropsType) {
  return (
    <Autocomplete
      options={zonelist}
      value={props.value}
      onChange={(_e: any, value: string) => props.onChange(value)}
      getOptionLabel={(option) => option.replace("_", " ")}
      style={props.style}
      renderInput={(params) => (
        <TextField {...params} label="Timezone" fullWidth />
      )}
    />
  );
});
