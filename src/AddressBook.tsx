import * as React from 'react';
import { List, ListItem } from 'material-ui/List';

import { ContactType } from './pim-types';

class AddressBook extends React.Component {
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

    let itemList = entries.map((entry) => {
      const uid = entry.uid;
      const name = entry.fn;

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
