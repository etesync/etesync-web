import * as React from 'react';
import BigCalendar, { View } from 'react-big-calendar';
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
    view?: View;
  };

  props: {
    entries: Array<EventType>,
    onItemClick: (contact: EventType) => void,
    onSlotClick?: (start: Date, end: Date) => void,
  };

  constructor(props: any) {
    super(props);
    this.state = {};

    this.onNavigate = this.onNavigate.bind(this);
    this.onView = this.onView.bind(this);
    this.slotClicked = this.slotClicked.bind(this);
  }

  onNavigate(currentDate: Date) {
    this.setState({currentDate});
  }

  onView(view: string) {
    this.setState({view});
  }

  slotClicked(slotInfo: {start: Date, end: Date}) {
    if (this.props.onSlotClick) {
      this.props.onSlotClick(slotInfo.start, slotInfo.end);
    }
  }

  render() {
    return (
      <div style={{width: '100%', height: 'calc(100vh - 230px)', minHeight: 500}}>
        <BigCalendar
          defaultDate={new Date()}
          events={this.props.entries}
          selectable={true}
          onSelectEvent={this.props.onItemClick as any}
          onSelectSlot={this.slotClicked as any}
          formats={{agendaHeaderFormat: agendaHeaderFormat as any}}
          eventPropGetter={eventPropGetter}
          date={this.state.currentDate}
          onNavigate={this.onNavigate}
          view={this.state.view}
          onView={this.onView}
        />
      </div>
    );
  }
}

export default Calendar;
