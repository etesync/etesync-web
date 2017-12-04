import * as React from 'react';
import { List, ListItem } from 'material-ui/List';
import IconAdd from 'material-ui/svg-icons/content/add';
import IconDelete from 'material-ui/svg-icons/action/delete';
import IconEdit from 'material-ui/svg-icons/editor/mode-edit';

import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

export class JournalViewEntries extends React.Component {
  static defaultProps = {
    prevUid: null,
  };

  props: {
    journal: EteSync.Journal,
    entries: Array<EteSync.SyncEntry>,
  };

  render() {
    if (this.props.journal === undefined) {
      return (<div>Loading</div>);
    }

    const entries = this.props.entries.map((syncEntry, idx) => {
      const comp = new ICAL.Component(ICAL.parse(syncEntry.content));

      let icon;
      if (syncEntry.action === EteSync.SyncEntryAction.Add) {
        icon = (<IconAdd color="#16B14B" />);
      } else if (syncEntry.action === EteSync.SyncEntryAction.Change) {
        icon = (<IconEdit color="#FEB115" />);
      } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
        icon = (<IconDelete color="#F20C0C" />);
      }

      if (comp.name === 'vcalendar') {
        const vevent = new ICAL.Event(comp.getFirstSubcomponent('vevent'));
        return (
          <ListItem
            key={idx}
            leftIcon={icon}
            primaryText={vevent.summary}
            secondaryText={vevent.uid}
          />
        );
      } else if (comp.name === 'vcard') {
        const vcard = comp;
        const name = vcard.getFirstPropertyValue('fn');
        const uid = vcard.getFirstPropertyValue('uid');
        return (
          <ListItem
            key={idx}
            leftIcon={icon}
            primaryText={name}
            secondaryText={uid}
          />
        );
      } else {
        return (
          <ListItem
            key={idx}
            leftIcon={icon}
            primaryText="Error processing entry"
          />
        );
      }
    }).reverse();

    return (
      <div>
        <List>
          {entries}
        </List>
      </div>
    );
  }
}
