import * as ICAL from 'ical.js';

export class EventType extends ICAL.Event {
  color: string;

  static fromVCalendar(comp: ICAL.Component) {
    return new EventType(comp.getFirstSubcomponent('vevent'));
  }

  get title() {
    return this.summary;
  }

  get start() {
    return this.startDate.toJSDate();
  }

  get end() {
    return this.endDate.toJSDate();
  }

  toIcal() {
    let comp = new ICAL.Component(['vcalendar', [], []]);
    comp.updatePropertyWithValue('prodid', '-//iCal.js EteSync Web');
    comp.updatePropertyWithValue('version', '4.0');

    comp.addSubcomponent(this.component);
    return comp.toString();
  }

  clone() {
    return new EventType(new ICAL.Component(this.component.toJSON()));
  }
}

export class ContactType {
  comp: ICAL.Component;

  constructor(comp: ICAL.Component) {
    this.comp = comp;
  }

  toIcal() {
    return this.comp.toString();
  }

  clone() {
    return new ContactType(new ICAL.Component(this.comp.toJSON()));
  }

  get uid() {
    return this.comp.getFirstPropertyValue('uid');
  }

  get fn() {
    return this.comp.getFirstPropertyValue('fn');
  }
}
