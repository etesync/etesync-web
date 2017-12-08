import * as React from 'react';

import { getPalette } from './App';

export default (props: {text: string, children?: any}) => {
    const style = {
      header: {
        backgroundColor: getPalette('accent1Color'),
        color: getPalette('alternateTextColor'),
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
};
