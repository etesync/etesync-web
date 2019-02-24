import * as React from 'react';

import { pure } from 'recompose';
import { createSelector } from 'reselect';

import * as colors from '@material-ui/core/colors';

import { Avatar } from '../widgets/Avatar';
import { List, ListItem } from '../widgets/List';

import { ContactType } from '../pim-types';

function getContactColor(contact: ContactType) {
  const colorOptions = [
    colors.red[500],
    colors.pink[500],
    colors.purple[500],
    colors.deepPurple[500],
    colors.indigo[500],
    colors.blue[500],
    colors.lightBlue[500],
    colors.cyan[500],
    colors.teal[500],
    colors.green[500],
    colors.lightGreen[500],
    colors.lime[500],
    colors.yellow[500],
    colors.amber[500],
    colors.orange[500],
    colors.deepOrange[500],
  ];

  let sum = 0;
  const uid = contact.uid;
  for (let i = 0 ; i < uid.length ; i++) {
    sum += uid.charCodeAt(i);
  }

  return colorOptions[sum % colorOptions.length];
}

const AddressBookItem = pure((_props: any) => {
  const {
    entry,
    onClick,
  } = _props;
  const name = entry.fn;

  return (
    <ListItem
      leftIcon={
        <Avatar style={{backgroundColor: getContactColor(entry)}}>
          {name[0].toUpperCase()}
        </Avatar>}
      primaryText={name}
      onClick={() => onClick(entry)}
    />
  );
});

const sortSelector = createSelector(
  (entries: ContactType[]) => entries,
  (entries) => {
    return entries.sort((_a, _b) => {
      const a = _a.fn;
      const b = _b.fn;

      return a.localeCompare(b, undefined, {sensitivity: 'base'});
    });
  }
);

interface PropsType {
  entries: ContactType[];
  onItemClick: (contact: ContactType) => void;
  filter?: (a: ContactType) => boolean;
}

class AddressBook extends React.PureComponent<PropsType> {
  public render() {
    const sortedEntries = sortSelector(this.props.entries);

    const entries = (this.props.filter) ?
      sortedEntries.filter(this.props.filter)
      : sortedEntries;

    const itemList = entries.map((entry, idx, array) => {
      const uid = entry.uid;

      return (
        <AddressBookItem
          key={uid}
          entry={entry}
          onClick={this.props.onItemClick}
        />
      );
    });

    return (
      <List>
        {itemList}
      </List>
    );
  }
}

export default AddressBook;
