import * as React from 'react';
import BigCalendar from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import * as moment from 'moment';

import * as ICAL from 'ical.js';

BigCalendar.momentLocalizer(moment);

class EventWrapper extends ICAL.Event {

  get title() {
    return this.summary;
  }

  get start() {
      return this.startDate.toJSDate();
  }

  get end() {
      return this.endDate.toJSDate();
  }
}

class Calendar extends React.Component {
  state: {
    currentDate?: Date;
  };

  props: {
    entries: Array<ICAL.Component>,
    onItemClick: (contact: ICAL.Event) => void,
  };

  constructor(props: any) {
    super(props);
    this.state = {};
  }

  render() {
    let entries = this.props.entries.map((value) => (
      new EventWrapper(value)
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
          onSelectEvent={(event: any) => {
            this.props.onItemClick(event);
          }}
          {...{culture: 'en-GB'}}
          date={this.state.currentDate}
          onNavigate={(currentDate: Date) => { this.setState({currentDate}); }}
        />
      </div>
    );
  }
}

export default Calendar;
