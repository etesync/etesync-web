import * as React from 'react';
import * as moment from 'moment';

import * as ICAL from 'ical.js';

function formatDateRange(start: ICAL.Time, end: ICAL.Time) {
  const mStart = moment(start.toJSDate());
  const mEnd = moment(end.toJSDate());
  let strStart;
  let strEnd;

  const allDayFormat = 'dddd, LL';
  const fullFormat = 'LLLL';

  // All day
  if (start.isDate) {
    if (mEnd.diff(mStart, 'days', true) === 1) {
      return mStart.format(allDayFormat);
    } else {
      strStart = mStart.format(allDayFormat);
      strEnd = mEnd.clone().subtract(1, 'day').format(allDayFormat);
    }
  } else if ((mStart.day === mEnd.day) && (mEnd.diff(mStart, 'days', true) < 1)) {
    strStart = mStart.format(fullFormat);
    strEnd = mEnd.format('LT');
  } else {
    strStart = mStart.format(fullFormat);
    strEnd = mEnd.format(fullFormat);
  }

  return strStart + ' - ' + strEnd;
}

class Event extends React.Component {
  props: {
    event?: ICAL.Event,
  };

  render() {
    if (this.props.event === undefined) {
      throw Error('Event should be defined!');
    }

    return (
      <div>
        <h2>{this.props.event.summary}</h2>
        <div>{formatDateRange(this.props.event.startDate, this.props.event.endDate)}</div>
        <div><u>{this.props.event.location}</u></div>
        <div>{this.props.event.description}</div>
        <div>Attendees: {this.props.event.attendees.map((x) => (x.getFirstValue())).join(', ')}</div>
      </div>
    );
  }
}

export default Event;
