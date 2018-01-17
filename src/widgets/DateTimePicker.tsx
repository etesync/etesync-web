import * as React from 'react';

import * as moment from 'moment';
import * as Datetime from 'react-datetime';

import 'react-datetime/css/react-datetime.css';

class DateTimePicker extends React.PureComponent {
  props: {
    placeholder: string,
    value?: Date,
    dateOnly?: boolean,
    onChange: (date?: Date) => void;
  };

  constructor(props: any) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(newDate: string | moment.Moment) {
    if (moment.isMoment(newDate)) {
      this.props.onChange(newDate.toDate());
    } else {
      this.props.onChange(undefined);
    }
  }

  render() {
    const inputProps = {
      placeholder: this.props.placeholder,
      readOnly: true,
    };
    return (
      <Datetime
        inputProps={inputProps}
        defaultValue={this.props.value}
        onChange={this.handleInputChange}
        timeFormat={!this.props.dateOnly}
      />
    );
  }
}

export default DateTimePicker;
