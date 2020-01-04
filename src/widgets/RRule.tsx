import * as React from 'react';
import Container from './Container';
import { TextField, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, InputLabel, FormControl } from '@material-ui/core';
import DateTimePicker from '../widgets/DateTimePicker';
import { isNumber } from 'util';

interface PropsType {
  onChange: (rrule: RRuleOptions) => void;
  rrule: RRuleOptions;
}
export interface RRuleOptions {
  freq: Frequency;
  interval: number;
  until?: Date;
  count?: number;
  byweekday?: Weekday[];
  bymonthday?: number;
  byyearday?: number;
  byweekno?: number;
  bymonth?: Months;
  bysetpos?: number;
}

enum Frequency {
  Year = 0,
  Month = 1,
  Week = 2,
  Day = 3,
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
enum Weekday {
  Mo,
  Tu,
  We,
  Th,
  Fr,
  Sa,
  Su
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
const weekdays = [Weekday.Mo, Weekday.Tu, Weekday.We, Weekday.Th, Weekday.Fr, Weekday.Sa, Weekday.Su];
const menuItemsFrequency = [Frequency.Year, Frequency.Month, Frequency.Week, Frequency.Day].map((value) => {
  return (
    <MenuItem key={value} value={value}>{Frequency[value]}</MenuItem>
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
    let byweekdayArray = options.byweekday as Weekday[];
    let byweekday;
    if (!checkbox.checked && byweekdayArray) {
      byweekday = byweekdayArray.filter((day) => day !== weekday);
    } else if (byweekdayArray) {
      byweekdayArray = byweekdayArray.filter((day) => day !== weekday);
      byweekday = [...byweekdayArray, weekday];
    } else {
      byweekday = [weekday];
    }
    updateRule({ byweekday: byweekday });
  }

  function isWeekdayChecked(day: number): boolean {
    const weekdayArray = options.byweekday;
    if (weekdayArray) {
      return isNumber(weekdayArray.find((value) => Weekday[value] === Weekday[day]));
    } else {
      return false;
    }
  }

  const checkboxWeekDays = weekdays.map((_, index) => {
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
        label={Weekday[index]} />
    );
  });

  return (
    <Container>
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
            const freq = Number((event.target as HTMLSelectElement).value);
            const updatedOptions = {
              freq: freq,
              bysetpos: undefined,
              bymonthday: freq === Frequency.Month || Frequency.Year === freq ? 1 : undefined,
              byweekday: undefined,
              bymonth: freq === Frequency.Year ? Months.Jan : undefined,
            };
            updateRule(updatedOptions);
          }}
        >
          {menuItemsFrequency}
        </Select>
      </div>
      <div style={{ display: 'flex' }}>

        {(options.freq === Frequency.Month) &&
          <Select
            value={options.bysetpos ? MonthRepeat.Bysetpos : MonthRepeat.Bymonthday}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              const value = Number((event.target as HTMLInputElement).value);
              if (value === MonthRepeat.Bymonthday) {
                updateRule({ bymonthday: 1, bysetpos: undefined, bymonth: Months.Jan });
              } else if (value === MonthRepeat.Bysetpos) {
                updateRule({ bysetpos: 1, bymonthday: undefined, bymonth: undefined });
              }
            }}
          >
            <MenuItem value={MonthRepeat.Bymonthday}>On</MenuItem>
            <MenuItem value={MonthRepeat.Bysetpos}>On the</MenuItem>
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
            <MenuItem value={4}>Fourth</MenuItem>
            <MenuItem value={-1}>Last</MenuItem>
          </Select>
        }
        {(options.freq === Frequency.Year && options.bymonth) &&
          <Select
            value={options.bymonth}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              updateRule({ bymonth: Number((event.target as HTMLInputElement).value) });
            }}>
            {menuItemsMonths}
          </Select>
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
                updateRule({ bymonthday: undefined });
              } else if (numberValue < 32 && numberValue > 0) {
                updateRule({ bymonthday: numberValue });
              }
            }}
          />

        }
      </div>
      <div>
        {options.freq !== Frequency.Day &&
          <FormGroup row>{checkboxWeekDays}</FormGroup>
        }
        <FormControl>
          <InputLabel>Ends</InputLabel>
          <Select
            value={getEnds()}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              const value = Number((event.target as HTMLSelectElement).value);
              let updateOptions;
              if (value === Ends.Date) {
                updateOptions = { count: undefined, until: new Date() };
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
            value={options.until || undefined}
            placeholder="Ends"
            onChange={(date?: Date) => updateRule({ until: date })}
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
    </Container>
  );
}
