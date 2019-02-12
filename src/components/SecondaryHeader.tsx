import * as React from 'react';

import { Theme, withTheme } from '@material-ui/core/styles';

export default withTheme()((props: {children: React.ReactNode | React.ReactNode[], theme: Theme}) => {
    const style = {
      header: {
        backgroundColor: props.theme.palette.primary.main,
        color: props.theme.palette.primary.contrastText,
        padding: 15,
        textAlign: 'center' as any,
      },
      headerText: {
        margin: 0,
      },
    };

    return (
      <div style={style.header}>
        <h2 style={style.headerText}>{props.children}</h2>
      </div>
    );
});
