import * as React from 'react';
import Container from './Container';
import { Radio, TextField, FormControlLabel, RadioGroup } from '@material-ui/core';
import RRule from 'rrule';
import DateTimePicker from '../widgets/DateTimePicker';

interface PropsType {
  onChange: (rrule: string) => void;
  rrule: string;
}

const frequency = {
  YEARLY: 0,
  MONTHLY: 1,
  WEEKLY: 2,
  DAILY: 3,
  HOURLY: 4,
  MINUTELY: 5,
  SECONDLY: 6,
};

export default function RRuleEteSync(props: PropsType) {
  const options = RRule.fromString(props.rrule).origOptions;
  const updateRule = (value: any, name: string) => {
    const updatedOptions = {
      freq: options.freq,
      interval: options.interval,
      until: options.until,
      count: options.count,
    };
    updatedOptions[name] = value;
    const newRule = new RRule(updatedOptions);
    props.onChange(newRule.toString());
  };

  const radioButtonsFrequency = Object.keys(frequency).map((key) => {
    return (
      <FormControlLabel
        key={key}
        value={frequency[key]}
        control={<Radio />}
        label={key.toLowerCase()}
      />
    );
  return (
    <div>
      <Container>
        <RadioGroup
          row
          value={RRule.fromString(props.rrule).options.freq}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const freq: Frequency = Number(event.currentTarget.value);
            updateRule(props.rrule, freq, 'freq');
          }}
        >
          <FormControlLabel value={RRuleSet.HOURLY} control={<Radio />} label="Hour" />
          <FormControlLabel value={RRuleSet.DAILY} control={<Radio />} label="Day" />
          {radioButtonsFrequency}
        </RadioGroup>
      </Container>
      <Container>
        <TextField
          type="number"
          placeholder="Interval"
          inputProps={{ min: 1, max: 1000 }}
          value={options.interval}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            event.preventDefault();
            const inputNode = event.currentTarget as HTMLInputElement;
            if (inputNode.value === '') {
              updateRule(undefined, 'interval');
            } else if (inputNode.valueAsNumber) {
              updateRule(inputNode.valueAsNumber, 'interval');
            }
          }}
        />
        <TextField
          type="number"
          placeholder="Number of repetitions"
          value={options.count}
          inputProps={{ min: 1, step: 1 }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            event.preventDefault();
            const inputNode = event.currentTarget as HTMLInputElement;
            if (inputNode.value === '') {
            } else if (inputNode.valueAsNumber) {
              updateRule(props.rrule, inputNode.valueAsNumber, 'count');
            }
          }}
        />
        <DateTimePicker
          dateOnly
          //disabled={ends !== 'onDate'}
          value={RRule.fromString(props.rrule).options.until as Date || undefined}
          placeholder="Ends"
          onChange={(date?: Date) => updateRule(props.rrule, date, 'until')}
        />
      </Container>
    </div>
  );
}
