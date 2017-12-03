import * as React from 'react';

import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

export class JournalViewCalendar extends React.Component {
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

    let items: Map<string, any> = new Map();

    for (const syncEntry of this.props.entries) {
      let comp = new ICAL.Component(ICAL.parse(syncEntry.content)).getFirstSubcomponent('vevent');

      const uid = comp.getFirstPropertyValue('uid');

      if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
        (syncEntry.action === EteSync.SyncEntryAction.Change)) {
        items.set(uid, comp);
      } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
        items.delete(uid);
      }
    }

    // FIXME: should be ICAL.component
    let entries: Array<any> = Array.from(items.values()).map((value: string) => (
      new ICAL.Event(value)
    )).sort((a: any, b: any) => {
      if (a.summary < b.summary) {
        return -1;
      } else if (a.summary > b.summary) {
        return 1;
      } else {
        return 0;
      }
    });

    let itemList = entries.map((entry, idx) => {
      return (
        <li key={idx}>{entry.summary}</li>
      );
    });

    return (
      <div>
        <ul>
          {itemList}
        </ul>
      </div>
    );
  }
}
