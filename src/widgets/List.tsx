import * as React from 'react';
import { pure } from 'recompose';

import ExternalLink from './ExternalLink';

import './List.css';

export const List = pure((props: { children: React.ReactNode[] | React.ReactNode }) => (
  <ul className="List">
    {props.children}
  </ul>
));

export const ListItemRaw = pure((_props: any) => {
  const {
    href,
    children,
    nestedItems,
    insetChildren,
    ...props
  } = _props;

  const inner = href ?
    (
      <ExternalLink href={href} className="ListItem-href">
        {children}
      </ExternalLink>
    ) :
    children
  ;

  const nestedContent = nestedItems ?
    (
      <List>
        {nestedItems}
      </List>
    ) :
    undefined
  ;

  return (
    <React.Fragment>
      <li
        {...props}
        className={'ListItem ListItem-Item ' + ((insetChildren) ? 'ListItem-inset' : '')}
      >
        {inner}
      </li>
      <li className="ListItem-nested-holder">
        {nestedContent}
      </li>
    </React.Fragment>
  );
});

export const ListSubheader = pure((props: any) => (
  <li
    {...props}
    className="ListItem ListSubheader"
  >
    {props.children}
  </li>
));

export const ListDivider = pure((_props: any) => {
  const {
    inset,
    ...props
  } = _props;
  return (
    <li>
      <hr className={'ListDivider ' + (inset ? 'ListDivider-inset' : '')} {...props} />
    </li>
  );
});

export const ListItem = pure((_props: any) => {
  const {
    leftIcon,
    rightIcon,
    primaryText,
    secondaryText,
    children,
    ...props
  } = _props;

  const leftIconHolder = (leftIcon) ? (
    <div className="ListIcon">{leftIcon}</div>
  ) : undefined;

  let textHolder = primaryText;
  if (secondaryText) {
    textHolder = (
      <div className="ListItem-text-holder">
        <span className="ListItem-primary-text">{primaryText}</span>
        <span className="ListItem-secondary-text">{secondaryText}</span>
      </div>
    );
  }

  return (
    <ListItemRaw
      {...props}
    >
      {leftIconHolder}
      {textHolder}
      {children}
    </ListItemRaw>
  );
});
