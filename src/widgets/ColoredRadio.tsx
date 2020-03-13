// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import { Omit } from '@material-ui/types';
import FormControlLabel, { FormControlLabelProps } from '@material-ui/core/FormControlLabel';

interface Props {
  color: string;
  label: string;
}

const useStyles = makeStyles({
  root: {
    color: (props: Props) => props.color,
  },
});

export default function ColoredRadio(props: Props & Omit<FormControlLabelProps, keyof Props | 'control'>) {
  const { color, label, value, ...other } = props;
  const { root } = useStyles(props);

  return <FormControlLabel
    className={root}
    label={label}
    control={<Radio color="default" className={root} value={value} />}
    {...other}
  />;
}
