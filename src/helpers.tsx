// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import * as ICAL from "ical.js";
import moment from "moment";
import { TaskPriorityType } from "./pim-types";

// Generic handling of input changes
export function handleInputChange(self: React.Component, part?: string) {
  return (event: React.ChangeEvent<any>) => {
    const name = event.target.name;
    const value = event.target.value;

    let newState;

    if (event.target.type === "checkbox") {
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

const allDayFormat = "dddd, LL";
const fullFormat = "LLLL";

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
    if (mEnd.diff(mStart, "days", true) === 1) {
      return mStart.format(allDayFormat);
    } else {
      strStart = mStart.format(allDayFormat);
      strEnd = mEnd.clone().subtract(1, "day").format(allDayFormat);
    }
  } else if (mStart.isSame(mEnd, "day")) {
    strStart = mStart.format(fullFormat);
    strEnd = mEnd.format("LT");

    if (mStart.isSame(mEnd)) {
      return strStart;
    }
  } else {
    strStart = mStart.format(fullFormat);
    strEnd = mEnd.format(fullFormat);
  }

  return strStart + " - " + strEnd;
}

export function formatOurTimezoneOffset() {
  let offset = new Date().getTimezoneOffset();
  const prefix = (offset > 0) ? "-" : "+";
  offset = Math.abs(offset);
  const hours = Math.floor(offset / 60);
  const minutes = offset % 60;

  return `GMT${prefix}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function getCurrentTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function mapPriority(priority: number): TaskPriorityType {
  if (priority > 0 && priority < 5) {
    return TaskPriorityType.High;
  } else if (priority === 5) {
    return TaskPriorityType.Medium;
  } else if (priority > 5 && priority < 10) {
    return TaskPriorityType.Low;
  } else {
    return TaskPriorityType.Undefined;
  }
}

export function* arrayToChunkIterator<T>(arr: T[], size: number) {
  for (let i = 0 ; i < arr.length ; i += size) {
    yield arr.slice(i, i + size);
  }
}

export function usePromiseMemo<T>(promise: Promise<T> | undefined | null, deps: React.DependencyList, initial: T | undefined = undefined): T | undefined {
  const [val, setVal] = React.useState<T>((promise as any)._returnedValue ?? initial);
  React.useEffect(() => {
    let cancel = false;
    if (promise === undefined || promise === null) {
      return undefined;
    }
    promise.then((val) => {
      (promise as any)._returnedValue = val;
      if (!cancel) {
        setVal(val);
      }
    });
    return () => {
      cancel = true;
    };
  }, [...deps, promise]);
  return val;
}
