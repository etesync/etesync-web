import * as React from 'react';
import * as moment from 'moment';

import PimItemHeader from './PimItemHeader';

import * as ICAL from 'ical.js';

import { EventType } from '../pim-types';

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

class Event extends React.PureComponent {
  props: {
    event?: EventType,
  };

  render() {
    if (this.props.event === undefined) {
      throw Error('Event should be defined!');
    }

    const style = {
      content: {
        padding: 15,
      },
    };

    return (
      <React.Fragment>
        <PimItemHeader text={this.props.event.summary} backgroundColor={this.props.event.color}>
          <div>{formatDateRange(this.props.event.startDate, this.props.event.endDate)}</div>
          <br/>
          <div><u>{this.props.event.location}</u></div>
        </PimItemHeader>
        <div style={style.content}>
          <div>{this.props.event.description}</div>
          {(this.props.event.attendees.length > 0) && (
            <div>Attendees: {this.props.event.attendees.map((x) => (x.getFirstValue())).join(', ')}</div>)}
        </div>
      </React.Fragment>
    );
  }
}

export default Event;
