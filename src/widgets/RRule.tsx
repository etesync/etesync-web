import * as React from 'react';
import Container from './Container';
import { TextField, Select, MenuItem, FormGroup, FormControlLabel, Checkbox } from '@material-ui/core';
import RRule, { Options, Weekday } from 'rrule';

import DateTimePicker from '../widgets/DateTimePicker';

interface PropsType {
  onChange: (rrule: string) => void;
  rrule: string;
}
const frequency = {
  yearly: 0,
  monthly: 1,
  weekly: 2,
  daily: 3,
};
const weekdays = { 0: 'MO', 1: 'TU', 2: 'WE', 3: 'TH', 4: 'FR', 5: 'SA', 6: 'SU' };
const bysetposWeekDay = Object.keys(weekdays).map((key) => {
  return (
    <MenuItem key={key} value={key}>{weekdays[key]}</MenuItem>
  );
});
const menuItemsFrequency = Object.keys(frequency).map((key) => {
  return (
    <MenuItem key={key} value={frequency[key]}>{key}</MenuItem>
  );
});

export default function RRuleEteSync(props: PropsType) {
  const options = RRule.fromString(props.rrule).origOptions;

  const updateRule = (newOptions: Partial<Options> = {}, weekdayToRemove: Weekday | null = null) => {
    const updatedOptions = { ...options, ...newOptions };
    if (Array.isArray(options.byweekday) && Array.isArray(newOptions.byweekday)) {
      updatedOptions.byweekday = [...options.byweekday, ...newOptions.byweekday];
    } else if (weekdayToRemove && Array.isArray(updatedOptions.byweekday)) {
      updatedOptions.byweekday = updatedOptions.byweekday.filter((day) => {
        return day.toString() !== weekdayToRemove.toString();
      });
    }
    const newRule = new RRule(updatedOptions);
    props.onChange(newRule.toString());
  };

  const getEnds = () => {
    if (options.until && !options.count) {
      return 'onDate';
    } else if (!options.until && options.count) {
      return 'after';
    } else {
      return 'never';
    }
  };
  const getMonthReapetType = () => {
    if (options.bysetpos) {
      return 'bysetpos';
    } else if (options.bymonthday) {
      return 'bymonthday';
    } else {
      return undefined;
    }
  };
  const isWeekdayChecked = (value: string) => {
    return options.byweekday?.toString().includes(weekdays[value]);
  };

  const checkboxWeekDays = Object.keys(weekdays).map((key) => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            key={key}
            value={key}
            checked={isWeekdayChecked(key)}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              const checkbox = event.target as HTMLInputElement;
              const weekday = new Weekday(Number(checkbox.value));
              if (!checkbox.checked) {
                updateRule({}, weekday);
              } else {
                updateRule({ byweekday: [weekday] });
              }

            }}
          />}
        key={key}
        label={weekdays[key]}
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
          const updatedOptions = {
            freq: Number((event.target as HTMLSelectElement).value),
            bysetpos: null,
            bymonthday: null,
            byweekday: null,
          };
          updateRule(updatedOptions);
        }}
      >
        {menuItemsFrequency}
      </Select>
      <Select
        value={getEnds()}
        onChange={(event: React.FormEvent<{ value: unknown }>) => {
          const value = (event.target as HTMLSelectElement).value;
          switch (value) {
            case 'onDate':
              updateRule({ count: null, until: new Date() });
              break;
            case 'after':
              updateRule({ until: undefined, count: 1 });
              break;
            default:
              updateRule({ count: null, until: undefined });
              break;
          }
        }}>
        <MenuItem value="never">Never</MenuItem>
        <MenuItem value="after">After</MenuItem>
        <MenuItem value="onDate">On Date</MenuItem>
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

      {options.freq === frequency['weekly'] &&
        <FormGroup
          row>
          {checkboxWeekDays}
        </FormGroup>
      }
      {options.freq === frequency['monthly'] &&
        <span>
          <Select
            value={getMonthReapetType()}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              const value = (event.target as HTMLInputElement).value;
              if (value === 'bymonthday') {
                updateRule({ bymonthday: 1, bysetpos: null });
              } else if (value === 'bysetpos') {
                updateRule({ bymonthday: null, bysetpos: 1 });
              }

            }}
          >
            <MenuItem value="bymonthday">On day</MenuItem>
            <MenuItem value="bysetpos">On the</MenuItem>
          </Select>
        </span>
      }
      {options.bymonthday && <Select
        value={options.bymonthday || 1}
        onChange={(event: React.FormEvent<{ value: unknown }>) => {
          updateRule({ bymonthday: Number((event.target as HTMLInputElement).value) });
        }}>
        {menuItemDaysNumbers}
      </Select>
      }
      {options.bysetpos &&
        <span>
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
          <Select
            value={options.byweekday ? options.byweekday[0].weekday : undefined}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              updateRule({ byweekday: new Weekday(Number((event.target as HTMLInputElement).value)) });
            }}>
            {bysetposWeekDay}
          </Select>
        </span>
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
