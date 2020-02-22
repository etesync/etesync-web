import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import * as colors from '@material-ui/core/colors';
import Radio from '@material-ui/core/Radio';
import { Omit } from '@material-ui/types';
import FormControlLabel, { FormControlLabelProps } from '@material-ui/core/FormControlLabel';

interface Props {
  color: string;
  label: string;
}

const useStyles = makeStyles({
  root: {
    color: (props: Props) => colors[props.color][600],
  },
});

const ColoredRadio = (props: Props & Omit<FormControlLabelProps, keyof Props | 'control'>) => {
  const { color, label, value, ...other } = props;
  const { root } = useStyles(props);

  return <FormControlLabel
    className={root}
    label={label}
    control={<Radio color="default" className={root} value={value} />}
    {...other}
  />;
};

export default ColoredRadio;
