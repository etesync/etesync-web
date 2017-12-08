import * as React from 'react';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import CommunicationCall from 'material-ui/svg-icons/communication/call';
import CommunicationChatBubble from 'material-ui/svg-icons/communication/chat-bubble';
import CommunicationEmail from 'material-ui/svg-icons/communication/email';
import { indigo500 } from 'material-ui/styles/colors';

import PimItemHeader from './PimItemHeader';

import { ContactType } from './pim-types';

class Contact extends React.Component {
  props: {
    contact?: ContactType,
  };

  render() {
    if (this.props.contact === undefined) {
      throw Error('Contact should be defined!');
    }

    const contact = this.props.contact;
    const name = contact.fn;

    let lists = [];

    function getAllType(
      propName: string,
      props: any,
      valueToHref?: (value: string) => string,
      primaryTransform?: (value: string) => string,
      secondaryTransform?: (value: string) => string) {

      return contact.comp.getAllProperties(propName).map((prop, idx) => {
        const json = prop.toJSON();
        const values = prop.getValues().map((val) => (
          <ListItem
            key={idx}
            href={valueToHref ? valueToHref(val) : undefined}
            primaryText={primaryTransform ? primaryTransform(val) : val}
            secondaryText={json[1].type}
            {...props}
          />
        ));
        return values;
      });
    }

    lists.push(getAllType(
      'tel',
      {
        leftIcon: <CommunicationCall />,
        rightIcon: <CommunicationChatBubble />
      },
      (x) => ('tel:' + x),
    ));

    lists.push(getAllType(
      'email',
      {
        leftIcon: <CommunicationEmail color={indigo500} />,
      },
      (x) => ('mailto:' + x),
    ));

    lists.push(getAllType(
      'impp',
      {
          insetChildren: true,
      },
      (x) => x,
      (x) => (x.substring(x.indexOf(':') + 1)),
    ));

    const skips = ['tel', 'email', 'impp', 'prodid', 'uid', 'fn', 'n', 'version', 'photo'];
    const theRest = contact.comp.getAllProperties().filter((prop) => (
      skips.indexOf(prop.name) === -1
      )).map((prop, idx) => {
      const values = prop.getValues().map((_val) => {
        const val = (_val instanceof String) ? _val : _val.toString();
        return (
          <ListItem
            key={idx}
            insetChildren={true}
            primaryText={val}
            secondaryText={prop.name}
          />
        );
      });
      return values;
    });

    function listIfNotEmpty(items: Array<Array<JSX.Element>>) {
      if (items.length > 0) {
        return (
          <React.Fragment>
            <List>
              {items}
            </List>
            <Divider inset={true} />
          </React.Fragment>
        );
      } else {
        return undefined;
      }
    }

    return (
      <div>
        <PimItemHeader text={name} />
        {lists.map((list, idx) => (
          <React.Fragment key={idx}>
            {listIfNotEmpty(list)}
          </React.Fragment>
          ))}
        <List>
          {theRest}
        </List>
      </div>
    );
  }
}

export default Contact;
