import * as React from 'react';
import Container from './Container';
import { TextField, Select, InputLabel, MenuItem, FormGroup, FormControlLabel, Checkbox } from '@material-ui/core';
import RRule from 'rrule';
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
const weekdays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const menuItemsFrequency = Object.keys(frequency).map((key) => {
  return (
    <MenuItem key={key} value={frequency[key]}>{key}</MenuItem>
  );
});

export default function RRuleEteSync(props: PropsType) {
  const options = RRule.fromString(props.rrule).origOptions;
  const updateRule = (optionsObjbect: Record<string, any>) => {
    const updatedOptions = {
      freq: options.freq,
      interval: options.interval,
      until: options.until,
      count: options.count,
      byweekday: options.byweekday,
    };
    for (const key in optionsObjbect) {
      updatedOptions[key] = optionsObjbect[key];
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

  const checkboxWeekDays = weekdays.map((value) => {
    return (
      <FormControlLabel
        control={<Checkbox key={value} value={value} />}
        key={value}
        label={value}
      />
    );
  });

  return (
    <Container>
      <InputLabel id="freq-label">Repeat</InputLabel>
      <Select
        value={options.freq}
        onChange={(event: React.FormEvent<{ value: unknown }>) => {
          const value = (event.target as HTMLSelectElement).value;
          updateRule({ freq: Number(value) });
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
        <FormGroup row>
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
      <TextField
        type="number"
        placeholder="Number of repetitions"
        disabled={!options.count}
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
      />
      <DateTimePicker
        dateOnly
        value={options.until || undefined}
        disabled={!options.until}
        placeholder="Ends"
        onChange={(date?: Date) =>
          updateRule({ until: date })}
      />
    </Container>
  );
}
