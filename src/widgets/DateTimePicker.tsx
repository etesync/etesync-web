import * as React from 'react';

import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider, KeyboardDatePicker, KeyboardDateTimePicker } from '@material-ui/pickers';

import moment from 'moment';

interface PropsType {
  placeholder: string;
  value?: Date;
  dateOnly?: boolean;
  onChange: (date?: Date) => void;
}

class DateTimePicker extends React.PureComponent<PropsType> {
  constructor(props: any) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  public render() {
    const Picker = (this.props.dateOnly) ? KeyboardDatePicker : KeyboardDateTimePicker;
    const dateFormat = (this.props.dateOnly) ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm';
    return (
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <Picker
          value={this.props.value || null}
          onChange={this.handleInputChange}
          format={dateFormat}
          ampm={false}
          showTodayButton
          KeyboardButtonProps={{
            'aria-label': 'change date',
          }}
        />
      </MuiPickersUtilsProvider>
    );
  }

  private handleInputChange(date: moment.Moment) {
    if (moment.isMoment(date)) {
      this.props.onChange(date.toDate());
    } else {
      this.props.onChange(undefined);
    }
  }
}

export default DateTimePicker;
