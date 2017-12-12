import * as ICAL from 'ical.js';

export class EventType extends ICAL.Event {
  color: string;

  get title() {
    return this.summary;
  }

  get start() {
    return this.startDate.toJSDate();
  }

  get end() {
    return this.endDate.toJSDate();
  }

  static fromVCalendar(comp: ICAL.Component) {
    return new EventType(comp.getFirstSubcomponent('vevent'));
  }
}

export class ContactType {
  comp: ICAL.Component;

  constructor(comp: ICAL.Component) {
    this.comp = comp;
  }

  get uid() {
    return this.comp.getFirstPropertyValue('uid');
  }

  get fn() {
    return this.comp.getFirstPropertyValue('fn');
  }
}
