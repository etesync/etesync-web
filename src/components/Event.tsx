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
    item?: EventType,
  };

  render() {
    if (this.props.item === undefined) {
      throw Error('Event should be defined!');
    }

    const style = {
      content: {
        padding: 15,
      },
    };

    return (
      <React.Fragment>
        <PimItemHeader text={this.props.item.summary} backgroundColor={this.props.item.color}>
          <div>{formatDateRange(this.props.item.startDate, this.props.item.endDate)}</div>
          <br/>
          <div><u>{this.props.item.location}</u></div>
        </PimItemHeader>
        <div style={style.content}>
          <div>{this.props.item.description}</div>
          {(this.props.item.attendees.length > 0) && (
            <div>Attendees: {this.props.item.attendees.map((x) => (x.getFirstValue())).join(', ')}</div>)}
        </div>
      </React.Fragment>
    );
  }
}

export default Event;
