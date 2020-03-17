// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { createStyles, makeStyles } from '@material-ui/core/styles';
import MuiList from '@material-ui/core/List';
import MuiListItem from '@material-ui/core/ListItem';
import MuiListSubheader from '@material-ui/core/ListSubheader';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

import ExternalLink from './ExternalLink';

const useStyles = makeStyles((theme) => (createStyles({
  inset: {
    marginLeft: 64,
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
})));

export const List = MuiList;

export const ListSubheader = MuiListSubheader;

export const ListDivider = React.memo(function ListDivider(props: { inset?: boolean }) {
  const classes = useStyles();
  const insetClass = (props.inset) ? classes.inset : undefined;
  return (
    <Divider className={insetClass} />
  );
});

interface ListItemPropsType {
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  style?: React.CSSProperties;
  primaryText?: string;
  secondaryText?: string;
  children?: React.ReactNode | React.ReactNode[];
  onClick?: () => void;
  href?: string;
  insetChildren?: boolean;
  nestedItems?: React.ReactNode[];
}

export const ListItem = React.memo(function ListItem(_props: ListItemPropsType) {
  const classes = useStyles();
  const {
    leftIcon,
    rightIcon,
    primaryText,
    secondaryText,
    children,
    onClick,
    href,
    style,
    insetChildren,
    nestedItems,
  } = _props;

  const extraProps = (onClick || href) ? {
    button: true,
    href,
    onClick,
    component: (href) ? ExternalLink : 'div',
  } : undefined;

  return (
    <>
      <MuiListItem
        style={style}
        onClick={onClick}
        {...(extraProps as any)}
      >
        {leftIcon && (
          <ListItemIcon>
            {leftIcon}
          </ListItemIcon>
        )}
        <ListItemText inset={insetChildren} primary={primaryText} secondary={secondaryText}>
          {children}
        </ListItemText>
        {rightIcon && (
          <ListItemIcon>
            {rightIcon}
          </ListItemIcon>
        )}
      </MuiListItem>
      {nestedItems && (
        <List className={classes.nested} disablePadding>
          {nestedItems}
        </List>
      )}
    </>
  );
});
