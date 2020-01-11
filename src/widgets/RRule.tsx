import * as React from 'react';
import { TextField, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, InputLabel, FormControl, FormLabel } from '@material-ui/core';
import DateTimePicker from '../widgets/DateTimePicker';
import { isNumber } from 'util';
import * as ICAL from 'ical.js';

interface PropsType {
  onChange: (rrule: RRuleOptions) => void;
  rrule: RRuleOptions;
}
type Frequency = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'HOURLY' | 'MINUTELY' | 'SECONDLY';
const disableComplex = true;
export interface RRuleOptions {
  freq: Frequency;
  interval?: number;
  wkst?: WeekDay;
  until?: ICAL.Time;
  count?: number;
  bysecond?: number[];
  byminute?: number[];
  byhour?: number[];
  byday?: number[];
  bymonthday?: number[];
  byyearday?: number[];
  byweekno?: number[];
  bymonth?: number[];
  bysetpos?: number[];
}
enum Ends {
  Never,
  Date,
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
const menuItemsEnds = [Ends.Never, Ends.Date, Ends.After].map((key) => {
  return (
    <MenuItem key={key} value={key}>{Ends[key]}</MenuItem>
  );
});
const weekdays = [WeekDay.Su, WeekDay.Mo, WeekDay.Tu, WeekDay.We, WeekDay.Th, WeekDay.Fr, WeekDay.Sa];
const months = [
  Months.Jan,
  Months.Feb,
  Months.Mar,
  Months.Apr,
  Months.May,
  Months.Jun,
  Months.Jul,
  Months.Aug,
  Months.Sep,
  Months.Oct,
  Months.Nov,
  Months.Dec,
];

const menuItemsFrequency = ['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'].map((value) => {
  return (
    <MenuItem key={value} value={value}>{value.toLowerCase()}</MenuItem>
  );
});

export default function RRuleEteSync(props: PropsType) {
  const options = props.rrule;

  function updateRule(newOptions: Partial<RRuleOptions>): void {
    const updatedOptions = { ...options, ...newOptions };
    props.onChange(updatedOptions);
  }

  function getEnds(): Ends {
    if (options.until && !options.count) {
      return Ends.Date;
    } else if (!options.until && options.count) {
      return Ends.After;
    } else {
      return Ends.Never;
    }
  }

  function handleCheckboxWeekday(event: React.FormEvent<{ value: unknown }>): void {
    const checkbox = event.target as HTMLInputElement;
    const weekday = Number(checkbox.value);
    let byweekdayArray = options.byday as WeekDay[];
    let byweekday;
    if (!checkbox.checked && byweekdayArray) {
      byweekday = byweekdayArray.filter((day) => day !== weekday);
    } else if (byweekdayArray) {
      byweekdayArray = byweekdayArray.filter((day) => day !== weekday);
      byweekday = [...byweekdayArray, weekday];
    } else {
      byweekday = [weekday];
    }
    updateRule({ byday: byweekday });
  }
  function handleCheckboxMonth(event: React.FormEvent<{ value: unknown }>): void {
    const checkbox = event.target as HTMLInputElement;
    const month = Number(checkbox.value);
    let bymonthArray = options.bymonth as Months[];
    let bymonth;
    if (!checkbox.checked && bymonthArray) {
      bymonth = bymonthArray.filter((day) => day !== month);
    } else if (bymonthArray) {
      bymonthArray = bymonthArray.filter((day) => day !== month);
      bymonth = [...bymonthArray, month];
    } else {
      bymonth = [month];
    }
    updateRule({ bymonth: bymonth });
  }
  function isMonthChecked(month: number): boolean {
    if (options.bymonth) {
      return isNumber(options.bymonth.find((value) => Months[value] === Months[month]));
    } else {
      return false;
    }
  }
  function isWeekdayChecked(day: number): boolean {
    if (options.byday) {
      return isNumber(options.byday.find((value) => WeekDay[value] === WeekDay[day]));
    } else {
      return false;
    }
  }
  const checkboxMonths = months.map((month) => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            key={month}
            value={month}
            checked={isMonthChecked(month)}
            onChange={handleCheckboxMonth}
          />}
        key={month}
        label={Months[month]} />
    );
  });

  const checkboxWeekDays = weekdays.map((day) => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            key={day}
            value={day}
            checked={isWeekdayChecked(day)}
            onChange={handleCheckboxWeekday}
          />}
        key={day}
        label={WeekDay[day]} />
    );
  });

  return (
    <>
      <div style={{ display: 'flex' }}>
        <FormControlLabel
          value={options.freq}
          label="Repeat every :"
          labelPlacement="start"
          control={<TextField
            type="number"
            inputProps={{ min: 1, max: 1000 }}
            value={options.interval}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              event.preventDefault();
              const inputNode = event.currentTarget as HTMLInputElement;
              if (inputNode.value === '') {
                updateRule({ interval: undefined });
              } else if (inputNode.valueAsNumber) {
                updateRule({ interval: inputNode.valueAsNumber });
              }
            }}
          />}
        />
        <Select
          value={options.freq}
          style={{ alignSelf: 'flex-end', marginLeft: 20 }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const freq = (event.target as HTMLSelectElement).value as Frequency;
            const updatedOptions = {
              freq: freq,
              bysetpos: undefined,
              bymonthday: freq === 'MONTHLY' || 'YEARLY' === freq ? [1] : undefined,
              byweekday: undefined,
              bymonth: freq === 'YEARLY' ? [Months.Jan] : undefined,
            };
            updateRule(updatedOptions);
          }}
        >
          {menuItemsFrequency}
        </Select>
      </div>
      {options.bymonthday &&
        <TextField
          type="number"
          value={options.bymonthday[0]}
          label="Month day"
          style={{ width: 100 }}
          inputProps={{ min: 1, step: 1, max: 31 }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            event.preventDefault();
            const value = (event.currentTarget as HTMLInputElement).value;
            const numberValue = Number(value);
            if (value === '') {
              updateRule({ bymonthday: undefined });
            } else if (numberValue < 32 && numberValue > 0) {
              updateRule({ bymonthday: [numberValue] });
            }
          }}
        />
      }
      {
        !disableComplex && <div style={{ display: 'flex' }}>
          {(options.freq === 'MONTHLY') &&
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
            </Select>}           {options.bysetpos &&
              <Select value={options.bysetpos[0]}
                onChange={(event: React.FormEvent<{ value: unknown }>) => {
                  updateRule({ bysetpos: [Number((event.target as HTMLInputElement).value)] });
                }}>
                <MenuItem value={1}>First</MenuItem>
                <MenuItem value={2}>Second</MenuItem>
                <MenuItem value={3}>Third</MenuItem>
                <MenuItem value={4}>Fourth</MenuItem>
                <MenuItem value={-1}>Last</MenuItem>
              </Select>}
        </div>}
      <div>
        {options.freq === 'YEARLY' &&
          <div>
            <InputLabel>Months</InputLabel>
            <Select
              value={options.bymonth ? options.bymonth : []}
              multiple
              onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                const value = event.target.value as string[];
                if (value) {
                  updateRule({ bymonth: value.map((month) => Number(month)) });
                }
              }}>
              {menuItemMonths}
            </Select>
          </div>
        }
        {(options.freq && options.freq !== 'DAILY') &&
          <div>
            <InputLabel>Weekdays</InputLabel>
            <Select
              value={options.byday ? options.byday : []}
              multiple
              onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                const value = event.target.value as string[];
                if (value) {
                  updateRule({ byday: value.map((day) => Number(day)) });
                }
              }}>
              {menuItemsWeekDays}
            </Select>
          </div>
        }
        <FormControl>
          <InputLabel>Ends</InputLabel>
          <Select
            value={getEnds()}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              const value = Number((event.target as HTMLSelectElement).value);
              let updateOptions;
              if (value === Ends.Date) {
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
        </FormControl>
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
          <TextField
            type="number"
            value={options.count}
            label="Count"
            style={{ width: 60 }}
            inputProps={{ min: 1, step: 1 }}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              event.preventDefault();
              const inputNode = event.currentTarget as HTMLInputElement;
              if (inputNode.value === '') {
                updateRule({ count: 1 });
              } else if (inputNode.valueAsNumber) {
                updateRule({ count: inputNode.valueAsNumber });
              }
            }}
          />
        }
      </div>
    </>
  );
}
