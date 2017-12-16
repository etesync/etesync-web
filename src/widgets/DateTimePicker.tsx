import * as React from 'react';

class DateTimePicker extends React.PureComponent {
  state: {
    date: string,
    time: string,
  };

  props: {
    value?: string,
    dateOnly?: boolean,
    onChange: (date: Date) => void;
  };

  constructor(props: any) {
    super(props);
    this.state = {
      date: '',
      time: '',
    };

    if (props.value) {
      const str = props.value;
      this.state.date = str.substr(0, 10);
      this.state.time = str.substr(11, 5);
    }
    this.handleInputChange = this.handleInputChange.bind(this);
    this.reportChange = this.reportChange.bind(this);
  }

  handleInputChange(event: React.ChangeEvent<any>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState(
      {
        [name]: value
      },
      () => this.reportChange(this.props)
    );
  }

  componentWillReceiveProps(nextProps: any) {
    if (this.props.dateOnly !== nextProps.dateOnly) {
      this.reportChange(nextProps);
    }
  }

  reportChange(props: any) {
    const { date, time } = this.state;

    if (date !== undefined) {
      if (props.dateOnly) {
        props.onChange(date);
      } else if (time !== undefined) {
        props.onChange(date + ' ' + time + ':00');
      }
    }
  }

  render() {
    return (
      <React.Fragment>
        <input
          type="date"
          name="date"
          placeholder="Date"
          value={this.state.date}
          onChange={this.handleInputChange}
        />

       {this.props.dateOnly ||
        <input
          type="time"
          name="time"
          placeholder="Time"
          value={this.state.time}
          onChange={this.handleInputChange}
        />}
      </React.Fragment>
    );
  }
}

export default DateTimePicker;
