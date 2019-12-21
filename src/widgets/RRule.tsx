import * as React from 'react';
import Container from './Container';
import { RadioGroup, FormControlLabel, Radio, TextField } from '@material-ui/core';
import RRule, { RRuleSet, Frequency } from 'rrule';
import DateTimePicker from '../widgets/DateTimePicker';

interface PropsType {
  onChange: (rrule: string) => void;
  rrule: string;
}
export default function RRuleEteSync(props: PropsType) {

  const updateRule = (rule: string, value: any, name: string) => {
    const prevOptions = RRule.fromString(rule).options;
    const options = {
      freq: prevOptions.freq,
      interval: prevOptions.interval,
      until: prevOptions.until,
      count: prevOptions.count,
    };
    options[name] = value;
    const newRule = new RRule(options);
    props.onChange(newRule.toString());
  };

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
          <FormControlLabel value={RRuleSet.WEEKLY} control={<Radio />} label="Week" />
          <FormControlLabel value={RRuleSet.MONTHLY} control={<Radio />} label="Month" />
          <FormControlLabel value={RRuleSet.YEARLY} control={<Radio />} label="Year" />
        </RadioGroup>
      </Container>
      <Container>
        <TextField
          type="number"
          placeholder="Interval"
          inputProps={{ min: 1, max: 1000 }}
          value={RRule.fromString(props.rrule).options.interval}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            event.preventDefault();
            const inputNode = event.currentTarget as HTMLInputElement;
            if (inputNode.value === '') {
              updateRule(props.rrule, undefined, 'interval');
            } else if (inputNode.valueAsNumber) {
              updateRule(props.rrule, inputNode.valueAsNumber, 'interval');
            }
          }}
        />
        <TextField
          //disabled={ends !== 'after'}
          type="number"
          placeholder="Number of repetitions"
          value={RRule.fromString(props.rrule).options.count}
          inputProps={{ min: 1, step: 1 }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            event.preventDefault();
            const inputNode = event.currentTarget as HTMLInputElement;
            if (inputNode.value === '') {
              updateRule(props.rrule, null, 'count');
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
