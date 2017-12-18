import * as React from 'react';

import TextField from 'material-ui/TextField';

import IconButton from 'material-ui/IconButton';
import IconClear from 'material-ui/svg-icons/content/clear';

import { ContactType } from '../pim-types';

import AddressBook from '../components/AddressBook';

import { getPalette } from '../App';

class SearchableAddressBook extends React.PureComponent {
  props: {
    entries: Array<ContactType>,
    onItemClick: (contact: ContactType) => void,
  };

  state: {
    searchQuery: string;
  };

  constructor(props: any) {
    super(props);
    this.state = {searchQuery: ''};
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event: React.ChangeEvent<any>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({
      [name]: value
    });
  }

  render() {
    const {
      entries,
      ...rest,
    } = this.props;

    const reg = new RegExp(this.state.searchQuery, 'i');

    return (
      <React.Fragment>
        <TextField
          name="searchQuery"
          value={this.state.searchQuery}
          style={{fontSize: '120%', marginLeft: 20}}
          hintText="Find Contacts"
          hintStyle={{color: getPalette('accent1Color')}}
          onChange={this.handleInputChange}
        />
        {this.state.searchQuery &&
          <IconButton onClick={() => this.setState({'searchQuery': ''})}>
            <IconClear />
          </IconButton>
        }
        <AddressBook entries={entries} filter={(ent: ContactType) => ent.fn.match(reg)} {...rest} />
      </React.Fragment>
    );
  }
}

export default SearchableAddressBook;
