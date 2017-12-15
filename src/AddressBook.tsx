import * as React from 'react';

import * as colors from 'material-ui/styles/colors';

import { List, ListItem } from './List';

import { ContactType } from './pim-types';

class AddressBook extends React.PureComponent {
  props: {
    entries: Array<ContactType>,
    onItemClick: (contact: ContactType) => void,
  };

  render() {
    let entries = this.props.entries.sort((_a, _b) => {
      const a = _a.fn;
      const b = _b.fn;

      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    });

    function getContactColor(contact: ContactType) {
      const colorOptions = [
        colors.red500,
        colors.pink500,
        colors.purple500,
        colors.deepPurple500,
        colors.indigo500,
        colors.blue500,
        colors.lightBlue500,
        colors.cyan500,
        colors.teal500,
        colors.green500,
        colors.lightGreen500,
        colors.lime500,
        colors.yellow500,
        colors.amber500,
        colors.orange500,
        colors.deepOrange500,
      ];

      let sum = 0;
      const uid = contact.uid;
      for (let i = 0 ; i < uid.length ; i++) {
        sum += uid.charCodeAt(i);
      }

      return colorOptions[sum % colorOptions.length];
    }

    let itemList = entries.map((entry, idx, array) => {
      const uid = entry.uid;
      const name = entry.fn;

      let itemProps: any = {
        leftAvatar: (
          <div
            style={{
              backgroundColor: getContactColor(entry),
              color: 'white',
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '50%',
              height: 40,
              width: 40,
              marginRight: 15,
            }}
          >
          {name[0].toUpperCase()}
          </div>
        ),
      };

      return (
        <ListItem
          key={uid}
          onClick={(e: any) => {
            e.preventDefault();
            this.props.onItemClick(entry);
          }}
        >
          {itemProps.leftAvatar} {name}
        </ListItem>
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
