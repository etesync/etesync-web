import * as React from 'react';
import * as ICAL from 'ical.js';
import moment from 'moment';

// Generic handling of input changes
export function handleInputChange(self: React.Component, part?: string) {
  return (event: React.ChangeEvent<any>) => {
    const name = event.target.name;
    const value = event.target.value;

    let newState;

    if (event.target.type === 'checkbox') {
      newState = {
        [name]: event.target.checked,
      };
    } else {
      newState = {
        [name]: value,
      };
    }

    if (part === undefined) {
      self.setState(newState);
    } else {
      self.setState({
        [part]: {
          ...self.state[part],
          ...newState,
        },
      });
    }
  };
}

export function insertSorted<T>(array: T[] = [], newItem: T, key: string) {
  if (array.length === 0) {
    return [newItem];
  }

  for (let i = 0, len = array.length; i < len; i++) {
    if (newItem[key] < array[i][key]) {
      array.splice(i, 0, newItem);
      return array;
    }
  }

  array.push(newItem);

  return array;
}

const allDayFormat = 'dddd, LL';
const fullFormat = 'LLLL';

export function formatDate(date: ICAL.Time) {
  const mDate = moment(date.toJSDate());
  if (date.isDate) {
    return mDate.format(allDayFormat);
  } else {
    return mDate.format(fullFormat);
  }
}

export function formatDateRange(start: ICAL.Time, end: ICAL.Time) {
  const mStart = moment(start.toJSDate());
  const mEnd = moment(end.toJSDate());
  let strStart;
  let strEnd;

  // All day
  if (start.isDate) {
    if (mEnd.diff(mStart, 'days', true) === 1) {
      return mStart.format(allDayFormat);
    } else {
      strStart = mStart.format(allDayFormat);
      strEnd = mEnd.clone().subtract(1, 'day').format(allDayFormat);
    }
  } else if (mStart.isSame(mEnd, 'day')) {
    strStart = mStart.format(fullFormat);
    strEnd = mEnd.format('LT');

    if (mStart.isSame(mEnd)) {
      return strStart;
    }
  } else {
    strStart = mStart.format(fullFormat);
    strEnd = mEnd.format(fullFormat);
  }

  return strStart + ' - ' + strEnd;
}

export function formatOurTimezoneOffset() {
  let offset = new Date().getTimezoneOffset();
  const prefix = (offset > 0) ? '-' : '+';
  offset = Math.abs(offset);
  const hours = Math.floor(offset / 60);
  const minutes = offset % 60;

  return `GMT${prefix}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function getCurrentTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
