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
  yearly: 0,
  monthly: 1,
  weekly: 2,
  daily: 3,
};

export default function RRuleEteSync(props: PropsType) {
  const options = RRule.fromString(props.rrule).origOptions;
  const updateRule = (optionsObjbect: Record<string, any>) => {
    const updatedOptions = {
      freq: options.freq,
      interval: options.interval,
      until: options.until,
      count: options.count,
    };
    for (const key in optionsObjbect) {
      updatedOptions[key] = optionsObjbect[key];
    }
    const newRule = new RRule(updatedOptions);
    props.onChange(newRule.toString());
  };

  const radioButtonsFrequency = Object.keys(frequency).map((key) => {
    return (
      <FormControlLabel
        key={key}
        value={frequency[key]}
        control={<Radio />}
        label={key}
      />
    );
  });

  const getEnds = () => {
    if (options.until && !options.count) {
      return 'onDate';
    } else if (!options.until && options.count) {
      return 'after';
    } else {
      return 'never';
    }
  };

  return (
    <div>
      <Container>
        <RadioGroup
          value={options.freq}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            updateRule({ freq: Number(event.currentTarget.value) });
          }}
        >
          {radioButtonsFrequency}
        </RadioGroup>
      </Container>
      <Container>
        <RadioGroup
          value={getEnds()}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const value = event.currentTarget.value as string;
            console.log(value);
            if (value === 'never') {
              updateRule({ count: null, until: undefined });
            } else if (value === 'onDate') {
              updateRule({ count: null, until: new Date() });
            } else if (value === 'after') {
              updateRule({ until: undefined, count: 1 });
            }

          }}
        >
          <FormControlLabel value="never" control={<Radio />} label="Never" />
          <FormControlLabel value="after" control={<Radio />} label="After" />
          <FormControlLabel value="onDate" control={<Radio />} label="On Date" />
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
              updateRule({ interval: undefined });
            } else if (inputNode.valueAsNumber) {
              updateRule({ interval: inputNode.valueAsNumber });
            }
          }}
        />
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
    </div>
  );
}
