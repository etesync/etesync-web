import * as React from 'react';

import { getPalette } from '../App';

export default (props: {text: string}) => {
    const style = {
      header: {
        backgroundColor: getPalette('primary1Color'),
        color: getPalette('alternateTextColor'),
        padding: 15,
        textAlign: 'center',
      },
      headerText: {
        margin: 0,
      },
    };

    return (
      <div style={style.header}>
        <h2 style={style.headerText}>{props.text}</h2>
      </div>
    );
};
