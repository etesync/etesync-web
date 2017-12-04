import * as React from 'react';
import BigCalendar from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import * as moment from 'moment';

import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

BigCalendar.momentLocalizer(moment);

class EventWrapper {
  event: ICAL.Event;

  constructor(event: ICAL.Event) {
    this.event = event;
  }

  get summary() {
    return this.event.summary;
  }

  get title() {
    return this.summary;
  }

  get start() {
      return this.event.startDate.toJSDate();
  }

  get end() {
      return this.event.endDate.toJSDate();
  }
}

export class JournalViewCalendar extends React.Component {
  static defaultProps = {
    prevUid: null,
  };

  state: {
    currentDate?: Date;
  };

  props: {
    journal: EteSync.Journal,
    entries: Array<EteSync.SyncEntry>,
  };

  constructor(props: any) {
    super(props);
    this.state = {};
  }

  render() {
    if (this.props.journal === undefined) {
      return (<div>Loading</div>);
    }

    let items: Map<string, ICAL.Component> = new Map();

    for (const syncEntry of this.props.entries) {
      let comp = new ICAL.Component(ICAL.parse(syncEntry.content)).getFirstSubcomponent('vevent');

      if (comp === null) {
        continue;
      }

      const uid = comp.getFirstPropertyValue('uid');

      if ((syncEntry.action === EteSync.SyncEntryAction.Add) ||
        (syncEntry.action === EteSync.SyncEntryAction.Change)) {
        items.set(uid, comp);
      } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
        items.delete(uid);
      }
    }

    let entries = Array.from(items.values()).map((value) => (
      new EventWrapper(new ICAL.Event(value))
    )).sort((a, b) => {
      if (a.summary < b.summary) {
        return -1;
      } else if (a.summary > b.summary) {
        return 1;
      } else {
        return 0;
      }
    });

    return (
      <div style={{width: '100%', height: 500}}>
        <BigCalendar
          events={entries}
          {...{culture: 'en-GB'}}
          date={this.state.currentDate}
          onNavigate={(currentDate: Date) => { this.setState({currentDate}); }}
        />
      </div>
    );
  }
}
