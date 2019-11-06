import * as React from 'react';
import BigCalendar, { View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import * as ICAL from 'ical.js';

import { EventType } from '../pim-types';

import './Calendar.css';

const calendarLocalizer = BigCalendar.momentLocalizer(moment);

const MAX_RECURRENCE_DATE = ICAL.Time.now();
MAX_RECURRENCE_DATE.adjust(800, 0, 0, 0);

function eventPropGetter(event: EventType) {
  return {
    style: {
      backgroundColor: event.color,
    },
  };
}

function agendaHeaderFormat(date: {start: Date, end: Date}, culture: string, localizer: any) {
  const format = 'll';
  return localizer.format(date.start, format) + ' - ' + localizer.format(date.end, format);
}

interface PropsType {
  entries: EventType[];
  onItemClick: (contact: EventType) => void;
  onSlotClick?: (start: Date, end: Date) => void;
}

class Calendar extends React.PureComponent<PropsType> {
  public state: {
    currentDate?: Date;
    view?: View;
  };

  constructor(props: any) {
    super(props);
    this.state = {};

    this.onNavigate = this.onNavigate.bind(this);
    this.onView = this.onView.bind(this);
    this.slotClicked = this.slotClicked.bind(this);
  }

  public render() {
    const entries = [] as EventType[];
    this.props.entries.forEach((event) => {
      entries.push(event);

      if (event.isRecurring()) {
        const recur = event.iterator();

        let next = recur.next(); // Skip the first one
        while ((next = recur.next())) {
          if (next.compare(MAX_RECURRENCE_DATE) > 0) {
            break;
          }

          const shift = next.subtractDateTz(event.startDate);
          const ev = event.clone();
          (ev as any).journalUid = (event as any).journalUid;
          ev.startDate.addDuration(shift);
          ev.endDate.addDuration(shift);
          entries.push(ev);
        }
      }
    });

    return (
      <div style={{ width: '100%', height: 'calc(100vh - 230px)', minHeight: 500 }}>
        <BigCalendar
          defaultDate={new Date()}
          scrollToTime={new Date(1970, 1, 1, 8)}
          localizer={calendarLocalizer}
          events={entries}
          selectable
          onSelectEvent={this.props.onItemClick as any}
          onSelectSlot={this.slotClicked as any}
          formats={{ agendaHeaderFormat: agendaHeaderFormat as any }}
          eventPropGetter={eventPropGetter}
          date={this.state.currentDate}
          onNavigate={this.onNavigate}
          view={this.state.view}
          onView={this.onView}
        />
      </div>
    );
  }

  private onNavigate(currentDate: Date) {
    this.setState({ currentDate });
  }

  private onView(view: string) {
    this.setState({ view });
  }

  private slotClicked(slotInfo: {start: Date, end: Date}) {
    if (this.props.onSlotClick) {
      this.props.onSlotClick(slotInfo.start, slotInfo.end);
    }
  }
}

export default Calendar;
