// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import Input, { InputProps } from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import InputAdornment from "@material-ui/core/InputAdornment";
import FormHelperText from "@material-ui/core/FormHelperText";
import IconButton from "@material-ui/core/IconButton";
import FormControl from "@material-ui/core/FormControl";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";

let formIdCounter = 0;

export default function PasswordField(props_: Omit<InputProps, "type"> & { helperText?: string, label?: string }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const formId_ = React.useMemo(() => formIdCounter++, []);
  const { helperText, label, style, id, ...props } = props_;
  const formId = `password-field-${id ?? formId_}`;

  return (
    <FormControl style={style}>
      <InputLabel htmlFor={formId}>{label}</InputLabel>
      <Input
        {...props}
        id={formId}
        type={showPassword ? "text" : "password"}
        endAdornment={(
          <InputAdornment position="end">
            <IconButton
              aria-label="Toggle password visibility"
              title="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        )}
      />
      <FormHelperText id={formId}>{helperText}</FormHelperText>
    </FormControl>
  );
}
