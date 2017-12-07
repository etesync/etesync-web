import * as React from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import Calendar from './Calendar';

import * as ICAL from 'ical.js';

import * as EteSync from './api/EteSync';

class JournalCalendar extends React.Component {
  props: {
    journal: EteSync.Journal,
    entries: Map<string, ICAL.Component>,
    history?: any,
  };

  constructor(props: any) {
    super(props);
    this.eventClicked = this.eventClicked.bind(this);
  }

  eventClicked(contact: ICAL.Component) {
    // FIXME: do something
  }

  render() {
    let items = this.props.entries;

    return (
      <div style={{width: '100%', height: 500}}>
        <Calendar entries={Array.from(items.values())} onItemClick={this.eventClicked} />
      </div>
    );
  }
}

export default JournalCalendar;
