import * as ICAL from 'ical.js';

export class EventType extends ICAL.Event {
  get title() {
    return this.summary;
  }

  get start() {
      return this.startDate.toJSDate();
  }

  get end() {
      return this.endDate.toJSDate();
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
