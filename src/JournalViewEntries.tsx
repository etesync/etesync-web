import * as React from 'react';

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

      if (comp.name === 'vcalendar') {
        const vevent = new ICAL.Event(comp.getFirstSubcomponent('vevent'));
        return (<li key={idx}>{syncEntry.action}: {vevent.summary} ({vevent.uid})</li>);
      } else if (comp.name === 'vcard') {
        const vcard = comp;
        const name = vcard.getFirstPropertyValue('fn');
        const uid = vcard.getFirstPropertyValue('uid');
        return (<li key={idx}>{syncEntry.action}: {name} ({uid})</li>);
      } else {
        return (<li key={idx}>{syncEntry.action}: {syncEntry.content}</li>);
      }
    }).reverse();

    return (
      <div>
        <ul>
          {entries}
        </ul>
      </div>
    );
  }
}
