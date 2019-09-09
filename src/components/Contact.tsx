import * as React from 'react';
import moment from 'moment';

import { List, ListItem, ListDivider as Divider } from '../widgets/List';
import IconHome from '@material-ui/icons/Home';
import IconDate from '@material-ui/icons/DateRange';
import CommunicationCall from '@material-ui/icons/Call';
import CommunicationChatBubble from '@material-ui/icons/ChatBubble';
import CommunicationEmail from '@material-ui/icons/Email';

import PimItemHeader from './PimItemHeader';

import { ContactType } from '../pim-types';
import { IconButton } from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';

class Contact extends React.PureComponent {
  public props: {
    item?: ContactType,
  };

  public render() {
    if (this.props.item === undefined) {
      throw Error('Contact should be defined!');
    }

    const contact = this.props.item;
    const name = contact.fn;

    const revProp = contact.comp.getFirstProperty('rev');
    const lastModified = (revProp) ?
      'Modified: ' + moment(revProp.getFirstValue().toJSDate()).format('LLLL') : undefined;

    const lists = [];

    function getAllType(
      propName: string,
      props: any,
      valueToHref?: (value: string, type: string) => string,
      primaryTransform?: (value: string, type: string) => string,
      secondaryTransform?: (value: string, type: string) => string) {

      return contact.comp.getAllProperties(propName).map((prop, idx) => {
        const type = prop.toJSON()[1].type;
        const values = prop.getValues().map((val) => (
          <ListItem
            key={idx}
            href={valueToHref ? valueToHref(val, type) : undefined}
            primaryText={primaryTransform ? primaryTransform(val, type) : val}
            secondaryText={secondaryTransform ? secondaryTransform(val, type) : type}
            {...props}
          >
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                const node = e.currentTarget.parentElement;
                if (node) {
                  const text = node.innerText;
                  if (text) {
                    const selBox = document.createElement('textarea');
                    selBox.style.position = 'fixed';
                    selBox.style.left = '0';
                    selBox.style.top = '0';
                    selBox.style.opacity = '0';
                    selBox.value = text.split('\n')[0];
                    document.body.appendChild(selBox);
                    selBox.focus();
                    selBox.select();
                    document.execCommand('copy');
                    document.body.removeChild(selBox);
                  }
                }
              }}
            >
              <AssignmentIcon />
            </IconButton>
          </ListItem>
        ));
        return values;
      });
    }

    lists.push(getAllType(
      'tel',
      {
        leftIcon: <CommunicationCall />,
        rightIcon: <CommunicationChatBubble />,
      },
      (x) => ('tel:' + x)
    ));

    lists.push(getAllType(
      'email',
      {
        leftIcon: <CommunicationEmail />,
      },
      (x) => ('mailto:' + x)
    ));

    lists.push(getAllType(
      'impp',
      {
        leftIcon: <CommunicationChatBubble />,
      },
      (x) => x,
      (x) => (x.substring(x.indexOf(':') + 1)),
      (x) => (x.substring(0, x.indexOf(':')))
    ));

    lists.push(getAllType(
      'adr',
      {
        leftIcon: <IconHome />,
      }
    ));

    lists.push(getAllType(
      'bday',
      {
        leftIcon: <IconDate />,
      },
      undefined,
      ((x: any) => moment(x.toJSDate()).format('dddd, LL')),
      () => 'Birthday'
    ));

    lists.push(getAllType(
      'anniversary',
      {
        leftIcon: <IconDate />,
      },
      undefined,
      ((x: any) => moment(x.toJSDate()).format('dddd, LL')),
      () => 'Anniversary'
    ));

    const skips = ['tel', 'email', 'impp', 'adr', 'bday', 'anniversary', 'rev',
      'prodid', 'uid', 'fn', 'n', 'version', 'photo'];
    const theRest = contact.comp.getAllProperties().filter((prop) => (
      skips.indexOf(prop.name) === -1
    )).map((prop, idx) => {
      const values = prop.getValues().map((_val) => {
        const val = (_val instanceof String) ? _val : _val.toString();
        return (
          <ListItem
            key={idx}
            insetChildren
            primaryText={val}
            secondaryText={prop.name}
          />
        );
      });
      return values;
    });

    function listIfNotEmpty(items: JSX.Element[][]) {
      if (items.length > 0) {
        return (
          <React.Fragment>
            <List>
              {items}
            </List>
            <List>
              <Divider inset />
            </List>
          </React.Fragment>
        );
      } else {
        return undefined;
      }
    }

    return (
      <div>
        <PimItemHeader text={name}>
          {lastModified && (
            <span style={{ fontSize: '90%' }}>{lastModified}</span>
          )}
        </PimItemHeader>
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
