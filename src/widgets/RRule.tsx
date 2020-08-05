// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { TextField, Select, MenuItem, InputLabel, FormControl } from "@material-ui/core";
import DateTimePicker from "../widgets/DateTimePicker";
import * as ICAL from "ical.js";

export type RRuleOptions = ICAL.RecurData;

enum Ends {
  Forever,
  Until,
  After,
}

enum Months {
  Jan = 1,
  Feb,
  Mar,
  Apr,
  May,
  Jun,
  Jul,
  Aug,
  Sep,
  Oct,
  Nov,
  Dec,
}

enum MonthRepeat {
  Bysetpos,
  Bymonthday,
}

enum WeekDay {
  Su = 1,
  Mo,
  Tu,
  We,
  Th,
  Fr,
  Sa,
}

const disableComplex = true;

const weekdays: WeekDay[] = Array.from(Array(7)).map((_, i) => i + 1);
const months: Months[] = Array.from(Array(12)).map((_, i) => i + 1);

const menuItemsEnds = [Ends.Forever, Ends.Until, Ends.After].map((key) => {
  let displayhName;
  switch (key) {
    case Ends.Forever:
      displayhName = "Forever";
      break;
    case Ends.Until:
      displayhName = "Until";
      break;
    case Ends.After:
      displayhName = "For";
      break;
  }

  return (
    <MenuItem key={key} value={key}>{displayhName}</MenuItem>
  );
});
const menuItemsFrequency = ["YEARLY", "MONTHLY", "WEEKLY", "DAILY"].map((value) => {
  return (
    <MenuItem key={value} value={value}>{value.toLowerCase()}</MenuItem>
  );
});
const menuItemMonths = months.map((month) => {
  return (
    <MenuItem key={month} value={month}>{Months[month]}</MenuItem>
  );
});
const menuItemsWeekDays = weekdays.map((day) => {
  return (
    <MenuItem key={day} value={WeekDay[day].toUpperCase()}>{WeekDay[day]}</MenuItem>
  );
});

function makeArray<T>(item: T) {
  if (item === undefined) {
    return item;
  } else if (Array.isArray(item)) {
    return item;
  } else {
    return [item];
  }
}

function sanitizeByDay(item: string | string[] | undefined) {
  const ret = makeArray(item);
  if (Array.isArray(ret)) {
    return (ret as string[]).map((value) => {
      if (parseInt(value) === 1) {
        return value.substr(1);
      }
      return value;
    });
  } else {
    return [];
  }
}

const styles = {
  multiSelect: { minWidth: 120, maxWidth: "100%" },
  width: { width: 120 },
};

interface PropsType {
  onChange: (rrule: RRuleOptions) => void;
  rrule: RRuleOptions;
}

export default function RRule(props: PropsType) {
  const options = props.rrule;
  function updateRule(newOptions: Partial<RRuleOptions>, reset = false): void {
    const updatedOptions: RRuleOptions = { ...options, ...newOptions };

    if (reset) {
      props.onChange(updatedOptions);
      return;
    }

    for (const key of Object.keys(updatedOptions)) {
      const value = updatedOptions[key];
      if ((value === undefined) || (value?.length === 0)) {
        delete updatedOptions[key];
        continue;
      }
    }
    props.onChange(updatedOptions);
  }
  function getEnds(): Ends {
    if (options.until && !options.count) {
      return Ends.Until;
    } else if (!options.until && options.count) {
      return Ends.After;
    } else {
      return Ends.Forever;
    }
  }
  return (
    <div style={{ paddingLeft: "2em" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span>Repeat</span>
        <Select
          value={options.freq}
          style={{ marginLeft: "0.5em" }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const freq = (event.target as HTMLSelectElement).value as ICAL.FrequencyValues;
            updateRule({ freq: freq }, true);
          }}
        >
          {menuItemsFrequency}
        </Select>
        <span style={{ marginLeft: "0.5em" }}>every</span>
        <TextField
          style={{ marginLeft: "0.5em", width: "2.2em" }}
          type="number"
          inputProps={{ min: 1, max: 99 }}
          value={options.interval ?? 1}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            event.preventDefault();
            const inputNode = event.currentTarget as HTMLInputElement;
            if (inputNode.value === "") {
              updateRule({ interval: 1 });
            } else if (inputNode.valueAsNumber) {
              updateRule({ interval: inputNode.valueAsNumber });
            }
          }}
        />
      </div>
      {(options.freq && options.freq !== "DAILY") &&
        <div>
          <FormControl>
            <InputLabel>Weekdays</InputLabel>
            <Select
              value={sanitizeByDay(options.byday)}
              multiple
              style={styles.multiSelect}
              onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                const value = event.target.value as string[];
                updateRule({ byday: value });
              }}>
              {menuItemsWeekDays}
            </Select>
          </FormControl>
        </div>
      }
      {!disableComplex && (
        <div style={{ display: "flex" }}>
          {(options.freq === "MONTHLY") &&
            <Select value={options.bysetpos ? MonthRepeat.Bysetpos : MonthRepeat.Bymonthday}
              onChange={(event: React.FormEvent<{ value: unknown }>) => {
                const value = Number((event.target as HTMLInputElement).value);
                if (value === MonthRepeat.Bymonthday) {
                  updateRule({ bymonthday: [1], bysetpos: undefined, bymonth: [Months.Jan] });
                } else if (value === MonthRepeat.Bysetpos) {
                  updateRule({ bysetpos: [1], bymonthday: undefined, bymonth: undefined });
                }
              }}>
              <MenuItem value={MonthRepeat.Bymonthday}>On</MenuItem>
              <MenuItem value={MonthRepeat.Bysetpos}>On the</MenuItem>
            </Select>
          }
          {options.bysetpos &&
            <Select value={options.bysetpos[0]}
              onChange={(event: React.FormEvent<{ value: unknown }>) => {
                updateRule({ bysetpos: [Number((event.target as HTMLInputElement).value)] });
              }}>
              <MenuItem value={1}>First</MenuItem>
              <MenuItem value={2}>Second</MenuItem>
              <MenuItem value={3}>Third</MenuItem>
              <MenuItem value={4}>Fourth</MenuItem>
              <MenuItem value={-1}>Last</MenuItem>
            </Select>
          }
        </div>
      )}

      <div>
        {options.freq === "MONTHLY" &&
          <TextField
            type="number"
            value={options.bymonthday ? options.bymonthday[0] : undefined}
            label="Month day"
            style={styles.width}
            inputProps={{ min: 1, step: 1, max: 31 }}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              event.preventDefault();
              const value = (event.currentTarget as HTMLInputElement).value;
              const numberValue = Number(value);
              if (value === "") {
                updateRule({ bymonthday: undefined });
              } else if (numberValue < 32 && numberValue > 0) {
                updateRule({ bymonthday: [numberValue] });
              }
            }}
          />
        }
        {options.freq === "YEARLY" &&
          <div>
            <FormControl>
              <InputLabel>Months</InputLabel>
              <Select
                style={styles.multiSelect}
                value={makeArray(options.bymonth)}
                multiple
                onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                  const value = event.target.value as string[];
                  updateRule({ bymonth: value.map((month) => Number(month)) });
                }}>
                {menuItemMonths}
              </Select>
            </FormControl>
          </div>
        }
      </div>
      <div style={{ display: "inline-flex", alignItems: "center" }}>
        <Select
          value={getEnds()}
          style={{ marginRight: "0.5em" }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const value = Number((event.target as HTMLSelectElement).value);
            let updateOptions;
            if (value === Ends.Until) {
              updateOptions = { count: undefined, until: ICAL.Time.now() };
            } else if (value === Ends.After) {
              updateOptions = { until: undefined, count: 1 };
            } else {
              updateOptions = { count: undefined, until: undefined };
            }
            updateRule(updateOptions);
          }}>
          {menuItemsEnds}
        </Select>
        {options.until &&
          <DateTimePicker
            dateOnly
            value={options.until?.toJSDate() || undefined}
            placeholder="Ends"
            onChange={(date?: Date) => {
              const value = date ? date : null;
              updateRule({ until: ICAL.Time.fromJSDate(value, true) });
            }}
          />
        }
        {options.count &&
          <>
            <TextField
              type="number"
              value={options.count}
              style={{ width: "4em" }}
              inputProps={{ min: 1, step: 1 }}
              onChange={(event: React.FormEvent<{ value: unknown }>) => {
                event.preventDefault();
                const inputNode = event.currentTarget as HTMLInputElement;
                if (inputNode.value === "") {
                  updateRule({ count: 1 });
                } else if (inputNode.valueAsNumber) {
                  updateRule({ count: inputNode.valueAsNumber });
                }
              }}
            />
            <span style={{ marginLeft: "0.5em" }}>events</span>
          </>
        }
      </div>

    </div>
  );
}
