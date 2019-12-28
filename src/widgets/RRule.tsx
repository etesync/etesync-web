import * as React from 'react';
import Container from './Container';
import { TextField, Select, MenuItem, FormGroup, FormControlLabel, Checkbox } from '@material-ui/core';
import RRule, { Options, Weekday, Frequency, ByWeekday } from 'rrule';
import { ALL_WEEKDAYS } from 'rrule/dist/esm/src/weekday';
import DateTimePicker from '../widgets/DateTimePicker';

interface PropsType {
  onChange: (rrule: string) => void;
  rrule: string;
}
enum Ends {
  never,
  onDate,
  after,
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
enum MonthReapet {
  bysetpos,
  bymonthday,
}

const menueItemsMonths = Object.keys(Months).filter((key) => Number(key)).map((key) => {
  return (
    <MenuItem key={key} value={key}>{Months[key]}</MenuItem>
  );
});

const bysetposWeekDay = ALL_WEEKDAYS.map((value, index) => {
  return (
    <MenuItem key={index} value={index}>{value}</MenuItem>
  );
});
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
      return Ends.onDate;
    } else if (!options.until && options.count) {
      return Ends.after;
    } else {
      return Ends.never;
    }
  }
  function getMonthReapet(): MonthReapet {
    if (options.bysetpos) {
      return MonthReapet.bysetpos;
    } else {
      return MonthReapet.bymonthday;
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
  const checkboxWeekDays = ALL_WEEKDAYS.map((value, index) => {
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
        label={value}
      />
    );
  });
  const menuItemDaysNumbers = [];
  for (let index = 0; index < 31; index++) {
    menuItemDaysNumbers[index] = (<MenuItem key={index} value={index + 1}>{index + 1}</MenuItem>);
  }

  return (
    <Container>
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
      <Select
        value={getEnds()}
        onChange={(event: React.FormEvent<{ value: unknown }>) => {
          const value = Number((event.target as HTMLSelectElement).value);
          let updateOptions;
          if (value === Ends.onDate) {
            updateOptions = { count: null, until: new Date() };
          } else if (value === Ends.after) {
            updateOptions = { until: undefined, count: 1 };
          } else {
            updateOptions = { count: null, until: undefined };
          }
          updateRule(updateOptions);
        }}>
        <MenuItem value={Ends.never}>Never</MenuItem>
        <MenuItem value={Ends.after}>After</MenuItem>
        <MenuItem value={Ends.onDate}>On Date</MenuItem>
      </Select>

      <TextField
        type="number"
        placeholder="Interval"
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
      />

      {(options.freq === Frequency.WEEKLY) &&
        <FormGroup
          row>
          {checkboxWeekDays}
        </FormGroup>
      }
      {(options.freq === Frequency.MONTHLY || options.freq === Frequency.YEARLY) &&
        <Select
          value={getMonthReapet()}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const value = Number((event.target as HTMLInputElement).value);
            if (value === MonthReapet.bymonthday) {
              updateRule({ bymonthday: 1, bysetpos: null, bymonth: null });
            } else if (value === MonthReapet.bysetpos) {
              updateRule({ bymonthday: null, bysetpos: 1 });
            }
          }}
        >
          <MenuItem value={MonthReapet.bymonthday}>On day</MenuItem>
          <MenuItem value={MonthReapet.bysetpos}>On the</MenuItem>
        </Select>
      }
      {options.bymonthday &&
        <Select
          value={options.bymonthday || 1}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            updateRule({ bymonthday: Number((event.target as HTMLInputElement).value) });
          }}
        >
          {menuItemDaysNumbers}
        </Select>
      }
      {options.bysetpos &&
        <Select
          value={options.bysetpos}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            updateRule({ bysetpos: Number((event.target as HTMLInputElement).value) });
          }}>
          <MenuItem value={1}>First</MenuItem>
          <MenuItem value={2}>Second</MenuItem>
          <MenuItem value={3}>Third</MenuItem>
          <MenuItem value={4}>Foruth</MenuItem>
          <MenuItem value={-1}>Last</MenuItem>
        </Select>
      }
      {(options.bysetpos && !options.bymonthday) &&
        <Select
          value={options.byweekday ? options.byweekday[0].weekday : 1}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            updateRule({ byweekday: new Weekday(Number((event.target as HTMLInputElement).value)) });
          }}>
          {bysetposWeekDay}
        </Select>
      }
      {(options.freq === Frequency.YEARLY && options.bymonth) &&
        <Select value={options.bymonth} onChange={(event: React.FormEvent<{ value: unknown }>) => {
          updateRule({ bymonth: Number((event.target as HTMLInputElement).value) });
        }}
        >
          {menueItemsMonths}
        </Select>
      }
      {options.count &&
        <TextField
          type="number"
          value={options.count}
          inputProps={{ min: 1, step: 1 }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            event.preventDefault();
            const inputNode = event.currentTarget as HTMLInputElement;
            if (inputNode.value === '') {
              updateRule({ count: null });
            } else if (inputNode.valueAsNumber) {
              updateRule({ count: inputNode.valueAsNumber });
            }
          }}
        />}
      {options.until &&
        <DateTimePicker
          dateOnly
          value={options.until || undefined}
          placeholder="Ends"
          onChange={(date?: Date) => updateRule({ until: date })}
        />
      }
    </Container>
  );
}
