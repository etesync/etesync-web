import * as React from 'react';
import Container from './Container';
import { Input, RadioGroup, FormControlLabel, Radio, FormLabel } from '@material-ui/core';
import RRule, { RRuleSet, Frequency } from 'rrule';

interface PropsType { sendRRule: (rRule: string) => void }

export default function RRuleEteSync(props: PropsType) {
  const [frequency, setFrequency] = React.useState(RRuleSet.HOURLY);
  const [interval, setInterval] = React.useState<number | undefined>();
  const [ends, setEnds] = React.useState('never');
  const [until, setUntil] = React.useState<Date | null>(null);
  const [count, setCount] = React.useState<number | null | undefined>();
  const rule = new RRule({
    freq: frequency,
    interval: interval,
    dtstart: new Date(),
    until: until,
    count: count,
  });

  props.sendRRule(rule.toString());
  return (
    <Container>
      <Container>
        <FormLabel component="legend">
          {`Repeat ${Frequency[frequency].toLowerCase()}`}
        </FormLabel>
        <RadioGroup
          row
          value={frequency}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const freq: Frequency = Number(event.currentTarget.value);
            setFrequency(freq);
          }}
        >
          <FormControlLabel value={RRuleSet.HOURLY} control={<Radio />} label="Hour" />
          <FormControlLabel value={RRuleSet.DAILY} control={<Radio />} label="Day" />
          <FormControlLabel value={RRuleSet.WEEKLY} control={<Radio />} label="Week" />
          <FormControlLabel value={RRuleSet.MONTHLY} control={<Radio />} label="Month" />
          <FormControlLabel value={RRuleSet.YEARLY} control={<Radio />} label="Year" />
        </RadioGroup>
      </Container>
      <Input
        type="number"
        placeholder="Interval"
        inputProps={{ min: 1, max: 1000 }}
        value={interval}
        onChange={(event: React.FormEvent<{ value: unknown }>) => {
          event.preventDefault();
          const inputNode = event.currentTarget as HTMLInputElement;
          if (inputNode.value === '') {
            setInterval(undefined);
          } else if (inputNode.valueAsNumber) {
            setInterval(inputNode.valueAsNumber);
          }
        }}
      />

      <Container>
        <FormLabel component="legend">Ends</FormLabel>
        <RadioGroup
          row
          value={ends}
          onChange={(event: React.FormEvent<{ value: unknown }>) => { setEnds(event.currentTarget.value as string) }}
        >
          <FormControlLabel value="never" control={<Radio />} label="Never" />
          <FormControlLabel value="after" control={<Radio />} label="After" />
          <FormControlLabel value="onDate" control={<Radio />} label="On Date" />
        </RadioGroup>
      </Container>

      <Input
        disabled={ends !== 'after'}
        type="number"
        placeholder="Number of repetitions"
        value={count}
        inputProps={{ min: 1, step: 1 }}
        onChange={(event: React.FormEvent<{ value: unknown }>) => {
          event.preventDefault();
          const inputNode = event.currentTarget as HTMLInputElement;
          if (inputNode.value === '') {
            setCount(null);
          } else if (inputNode.valueAsNumber) {
            setCount(inputNode.valueAsNumber);
          }
        }}
      />
      <Input
        disabled={ends !== 'onDate'}
        type="date"
        value={until?.toISOString().split('T')[0]}
        onChange={(event: React.FormEvent<{ value: unknown }>) => {
          const dateInput = event.currentTarget as HTMLInputElement;
          setUntil(dateInput.valueAsDate);
        }}
      />
      <Container>{rule.toText()}</Container>
    </Container>
  );
}
