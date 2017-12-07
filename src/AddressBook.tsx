import * as React from 'react';
import { List, ListItem } from 'material-ui/List';

import * as ICAL from 'ical.js';

class AddressBook extends React.Component {
  props: {
    entries: Array<ICAL.Component>,
    onItemClick: (contact: ICAL.Component) => void,
  };

  render() {
    let entries = this.props.entries.sort((_a, _b) => {
      const a = _a.getFirstPropertyValue('fn');
      const b = _b.getFirstPropertyValue('fn');

      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    });

    let itemList = entries.map((entry) => {
      const uid = entry.getFirstPropertyValue('uid');
      const name = entry.getFirstPropertyValue('fn');
      return (
        <ListItem key={uid} primaryText={name} onClick={() => (this.props.onItemClick(entry))} />
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
