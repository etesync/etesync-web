import * as React from 'react';
import BigCalendar from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import * as moment from 'moment';
import 'moment/locale/en-gb';

import { EventType } from './pim-types';

moment.locale('en-gb');
BigCalendar.momentLocalizer(moment);

class Calendar extends React.Component {
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
    let entries = this.props.entries.sort((a, b) => {
      if (a.summary < b.summary) {
        return -1;
      } else if (a.summary > b.summary) {
        return 1;
      } else {
        return 0;
      }
    });

    function eventPropGetter(event: EventType) {
      return {
        style: {
          backgroundColor: event.color,
        }
      };
    }

    return (
      <div style={{width: '100%', height: 500, padding: 10}}>
        <BigCalendar
          events={entries}
          onSelectEvent={(event: any) => {
            this.props.onItemClick(event);
          }}
          eventPropGetter={eventPropGetter}
          date={this.state.currentDate}
          onNavigate={(currentDate: Date) => { this.setState({currentDate}); }}
        />
      </div>
    );
  }
}

export default Calendar;
