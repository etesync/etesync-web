import * as React from 'react';
import { pure } from 'recompose';

import './List.css';

export const ListItem = pure((props: any) => (
  <li
    {...props}
    className="ListItem"
  >
    {props.children}
  </li>
));

export const List = pure((props: { children: React.ReactNode[] | React.ReactNode }) => (
  <ul className="List">
    {props.children}
  </ul>
));
