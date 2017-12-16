import * as React from 'react';
import BigCalendar from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import * as moment from 'moment';
import 'moment/locale/en-gb';

import { EventType } from '../pim-types';

moment.locale('en-gb');
BigCalendar.momentLocalizer(moment);

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
  }

  render() {
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

    return (
      <div style={{width: '100%', height: 500, padding: 10}}>
        <BigCalendar
          events={this.props.entries}
          onSelectEvent={(event: any) => {
            this.props.onItemClick(event);
          }}
          formats={{agendaHeaderFormat: agendaHeaderFormat}}
          eventPropGetter={eventPropGetter}
          date={this.state.currentDate}
          onNavigate={(currentDate: Date) => { this.setState({currentDate}); }}
        />
      </div>
    );
  }
}

export default Calendar;
