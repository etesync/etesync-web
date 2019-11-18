import * as React from 'react';

import { Theme, withTheme } from '@material-ui/core/styles';

export default withTheme((props: {text: string, backgroundColor?: string, children?: any, theme: Theme}) => {
  const style = {
    header: {
      backgroundColor: (props.backgroundColor !== undefined) ?
        props.backgroundColor : props.theme.palette.secondary.main,
      color: props.theme.palette.secondary.contrastText,
      padding: 15,
    },
    headerText: {
      marginTop: 10,
      marginBottom: 10,
    },
  };

  return (
    <div style={style.header}>
      <h2 style={style.headerText}>{props.text}</h2>
      {props.children}
    </div>
  );
});
