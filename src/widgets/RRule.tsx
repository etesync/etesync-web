import * as React from 'react';
import Container from './Container';
import { TextField, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, InputLabel, FormControl } from '@material-ui/core';
import RRule, { Options, Weekday, Frequency, ByWeekday } from 'rrule';
import DateTimePicker from '../widgets/DateTimePicker';

interface PropsType {
  onChange: (rrule: string) => void;
  rrule: string;
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

const menuItemsMonths = Object.keys(Months).filter((key) => Number(key)).map((key) => {
  return (
    <MenuItem key={key} value={key}>{Months[key]}</MenuItem>
  );
});
const menuItemsEnds = [Ends.Never, Ends.Date, Ends.After].map((key) => {
  return (
    <MenuItem key={key} value={key}>{Ends[key]}</MenuItem>
  );
});
const weekdays = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
const menuItemsFrequency = Object.keys(Frequency).filter((key) => Number(key) < 4).map((value) => {
  return (
    <MenuItem key={value} value={value}>{Frequency[value].toLowerCase()}</MenuItem>
  );
});

export default function RRuleEteSync(props: PropsType) {
  const options = RRule.fromString(props.rrule).origOptions;

  function updateRule(newOptions: Partial<Options>): void {
    const updatedOptions = { ...options, ...newOptions };
    props.onChange((new RRule(updatedOptions)).toString());
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
    const weekday = new Weekday(Number(checkbox.value));
    let byweekdayArray = options.byweekday as ByWeekday[];
    let byweekday;
    if (!checkbox.checked && byweekdayArray) {
      byweekday = byweekdayArray.filter((day) => (day as Weekday).weekday !== weekday.weekday);
    } else if (byweekdayArray) {
      byweekdayArray = byweekdayArray.filter((day) => (day as Weekday).weekday !== weekday.weekday);
      byweekday = [...byweekdayArray, weekday];
    } else {
      byweekday = weekday;
    }
    updateRule({ byweekday: byweekday });
  }
  function isWeekdayChecked(day: number): boolean {
    const weekdayArray = options.byweekday as ByWeekday[];
    if (weekdayArray) {
      return !!(weekdayArray.find((value) => (value as Weekday).weekday === day));
    } else {
      return false;
    }
  }
  const checkboxWeekDays = weekdays.map((value, index) => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            key={index}
            value={index}
            checked={isWeekdayChecked(index)}
            onChange={handleCheckboxWeekday}
          />}
        key={index}
        label={value.toString()} />
    );
  });

  return (
    <Container>
      <div>
        <FormControl>
          <InputLabel>Repeat</InputLabel>
          <Select
            value={options.freq}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              const freq = Number((event.target as HTMLSelectElement).value);
              const updatedOptions = {
                freq: freq,
                bysetpos: null,
                bymonthday: freq === Frequency.MONTHLY ? Months.Jan : null,
                byweekday: null,
                bymonth: freq === Frequency.YEARLY ? 1 : null,
              };
              updateRule(updatedOptions);
            }}
          >
            {menuItemsFrequency}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Ends</InputLabel>
          <Select
            value={getEnds()}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              const value = Number((event.target as HTMLSelectElement).value);
              let updateOptions;
              if (value === Ends.Date) {
                updateOptions = { count: null, until: new Date() };
              } else if (value === Ends.After) {
                updateOptions = { until: undefined, count: 1 };
              } else {
                updateOptions = { count: null, until: undefined };
              }
              updateRule(updateOptions);
            }}>
            {menuItemsEnds}
          </Select>
        </FormControl>
        {options.until &&
          <DateTimePicker
            dateOnly
            value={options.until || undefined}
            placeholder="Ends"
            onChange={(date?: Date) => updateRule({ until: date })}
          />
        }
      </div>
      <div>
        <TextField
          type="number"
          label="Interval"
          inputProps={{ min: 1, max: 1000 }}
          style={{ width: 100 }}
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
        />
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
      {options.freq !== Frequency.DAILY &&
        <FormGroup row>{checkboxWeekDays}</FormGroup>
      }
      {(options.freq === Frequency.MONTHLY || options.freq === Frequency.YEARLY) &&
        <div>
          <Select
            value={options.bysetpos ? MonthRepeat.Bysetpos : MonthRepeat.Bymonthday}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              const value = Number((event.target as HTMLInputElement).value);
              if (value === MonthRepeat.Bymonthday) {
                updateRule({ bymonthday: 1, bysetpos: null, bymonth: null });
              } else if (value === MonthRepeat.Bysetpos) {
                updateRule({ bymonthday: null, bysetpos: 1 });
              }
            }}
          >
            <MenuItem value={MonthRepeat.Bymonthday}>On</MenuItem>
            <MenuItem value={MonthRepeat.Bysetpos}>On the</MenuItem>
          </Select>
        </div>
      }
      {options.bymonthday &&
        <TextField
          type="number"
          value={options.bymonthday}
          label="Month day"
          style={{ width: 100 }}
          inputProps={{ min: 1, step: 1, max: 31 }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            event.preventDefault();
            const value = (event.currentTarget as HTMLInputElement).value;
            const numberValue = Number(value);
            if (value === '') {
              updateRule({ bymonthday: null });
            } else if (numberValue < 32 && numberValue > 0) {
              updateRule({ bymonthday: numberValue });
            }
          }}
        />

      }
      <TextField
        type="number"
        value={options.bysetpos}
        label="Position"
        style={{ width: 100 }}
        inputProps={{ min: 1, step: 1 }}
        onChange={(event: React.FormEvent<{ value: unknown }>) => {
          event.preventDefault();
          const inputNode = event.currentTarget as HTMLInputElement;
          if (inputNode.value === '') {
            updateRule({ bysetpos: null });
          } else if (inputNode.valueAsNumber) {
            updateRule({ bysetpos: inputNode.valueAsNumber });
          }
        }}
      />
      {(options.freq === Frequency.YEARLY && options.bymonth) &&
        <FormControl>
          <InputLabel>Month</InputLabel>
          <Select
            value={options.bymonth}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              updateRule({ bymonth: Number((event.target as HTMLInputElement).value) });
            }}>
            {menuItemsMonths}
          </Select>
        </FormControl>
      }
    </Container>
  );
}
