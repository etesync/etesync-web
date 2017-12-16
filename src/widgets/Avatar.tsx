import * as React from 'react';
import { pure } from 'recompose';

export const Avatar = pure((props: { children: React.ReactNode[] | React.ReactNode, size?: number, style?: any }) => {
  const size = (props.size) ? props.size : 40;

  return (
    <div
      style={{
        backgroundColor: 'grey',
        color: 'white',
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
        height: size,
        width: size,
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
});
