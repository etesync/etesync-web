import * as React from 'react';
import Container from './Container';
import { TextField, Select, InputLabel, MenuItem, FormGroup, FormControlLabel, Checkbox } from '@material-ui/core';
//import RRule, { Options, WeekdayStr } from 'rrule';
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

  return (
    <Container>
      <InputLabel id="freq-label">Repeat</InputLabel>
      <Select
        value={options.freq}
        onChange={(event: React.FormEvent<{ value: unknown }>) => {
          const value = Number((event.target as HTMLSelectElement).value);
          if (value === 2) {
            updateRule({ freq: value });
          } else {
            updateRule({ freq: value, byweekday: null });
          }
        }}
        labelId="freq-label"
      >
        {menuItemsFrequency}
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

      <InputLabel id="end-label">End</InputLabel>
      <Select
        labelId="end-label"
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
      {options.count &&
        <TextField
          type="number"
          placeholder="Number of repetitions"
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
          onChange={(date?: Date) =>
            updateRule({ until: date })}
        />
      }
    </Container>
  );
}
