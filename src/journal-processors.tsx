import * as React from 'react';

import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

// FIXME: Figure out how to correctly use the props type
export function syncEntryToEntriesProps(WrappedComponent: any) {
  return class extends React.Component {
    props: any;

    render() {
      let items: Map<string, ICAL.Component> = new Map();

      for (const syncEntry of this.props.entries) {
        let comp = new ICAL.Component(ICAL.parse(syncEntry.content));

        const uid = comp.getFirstPropertyValue('uid');

        if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
          (syncEntry.action === EteSync.SyncEntryAction.Change)) {
          items.set(uid, comp);
        } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
          items.delete(uid);
        }
      }

      return (
        <WrappedComponent
          {...this.props}
          entries={items}
        />
      );
    }
  };
}
