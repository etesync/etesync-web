import * as React from 'react';
import BigCalendar from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import * as moment from 'moment';
import 'moment/locale/en-gb';

import { EventType } from '../pim-types';

import './Calendar.css';

moment.locale('en-gb');
BigCalendar.momentLocalizer(moment);

function eventPropGetter(event: EventType) {
  return {
    style: {
      backgroundColor: event.color,
    }
  };
}

function agendaHeaderFormat(date: {start: Date, end: Date}, culture: string, localizer: any) {
  const format = 'll';
  return localizer.format(date.start, format) + ' - ' + localizer.format(date.end, format);
}

class Calendar extends React.PureComponent {
  state: {
    currentDate?: Date;
  };

  props: {
    entries: Array<EventType>,
    onItemClick: (contact: EventType) => void,
  };

  constructor(props: any) {
    super(props);
    this.state = {};

    this.onNavigate = this.onNavigate.bind(this);
  }

  onNavigate(currentDate: Date) {
    this.setState({currentDate});
  }

  render() {
    return (
      <div style={{width: '100%', height: 500}}>
        <BigCalendar
          events={this.props.entries}
          onSelectEvent={this.props.onItemClick as any}
          formats={{agendaHeaderFormat: agendaHeaderFormat}}
          eventPropGetter={eventPropGetter}
          date={this.state.currentDate}
          onNavigate={this.onNavigate}
        />
      </div>
    );
  }
}

export default Calendar;
