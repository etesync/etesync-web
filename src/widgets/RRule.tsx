import * as React from 'react';
import Container from './Container';
import { TextField, Select, MenuItem, FormGroup, FormControlLabel, Checkbox } from '@material-ui/core';
import RRule, { Options, Weekday, Frequency } from 'rrule';
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
const frequency = [Frequency.YEARLY, Frequency.MONTHLY, Frequency.MONTHLY, Frequency.WEEKLY, Frequency.DAILY];

const months = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul',
  8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec',
};
const menueItemsMonths = Object.keys(months).map((key) => {
  return (
    <MenuItem key={key} value={key}>{months[key]}</MenuItem>
  );
});

const bysetposWeekDay = ALL_WEEKDAYS.map((value, index) => {
  return (
    <MenuItem key={index} value={index}>{value}</MenuItem>
  );
});
const menuItemsFrequency = frequency.map((value) => {
  return (
    <MenuItem key={value} value={value}>{Frequency[value].toLowerCase()}</MenuItem>
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

  function getEnds(): Ends {
    if (options.until && !options.count) {
      return Ends.onDate;
    } else if (!options.until && options.count) {
      return Ends.after;
    } else {
      return Ends.never;
    }
  }
  const getMonthReapetType = () => {
    if (options.bysetpos) {
      return 'bysetpos';
    } else if (options.bymonthday) {
      return 'bymonthday';
    } else {
      return '';
    }
  };
  const isWeekdayChecked = (value: string) => {
    return options.byweekday?.toString().includes(value);
  };

  const checkboxWeekDays = ALL_WEEKDAYS.map((value, index) => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            key={index}
            value={index}
            checked={isWeekdayChecked(value)}
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
          const updatedOptions = {
            freq: Number((event.target as HTMLSelectElement).value),
            bysetpos: null,
            bymonthday: null,
            byweekday: null,
            bymonth: null,
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
          switch (value) {
            case Ends.onDate:
              updateRule({ count: null, until: new Date() });
              break;
            case Ends.after:
              updateRule({ until: undefined, count: 1 });
              break;
            default:
              updateRule({ count: null, until: undefined });
              break;
          }
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
          value={getMonthReapetType()}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const value = (event.target as HTMLInputElement).value;
            if (value === 'bymonthday') {
              updateRule({ bymonthday: 1, bysetpos: null, bymonth: null });
            } else if (value === 'bysetpos') {
              updateRule({ bymonthday: null, bysetpos: 1 });
            }
          }}
        >
          <MenuItem value="bymonthday">On day</MenuItem>
          <MenuItem value="bysetpos">On the</MenuItem>
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
