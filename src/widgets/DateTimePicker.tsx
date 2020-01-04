import * as React from 'react';

import moment from 'moment';
import Datetime from 'react-datetime';

import 'react-datetime/css/react-datetime.css';

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

  private handleInputChange(newDate: string | moment.Moment) {
    if (moment.isMoment(newDate)) {
      this.props.onChange(newDate.toDate());
    } else {
      this.props.onChange(undefined);
    }
  }
}

export default DateTimePicker;
