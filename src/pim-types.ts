import * as ICAL from 'ical.js';

export interface PimType {
  uid: string;
  toIcal(): string;
  clone(): PimType;
}

export class EventType extends ICAL.Event implements PimType {
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

  get allDay() {
    return this.startDate.isDate;
  }

  get desc() {
    return this.description;
  }

  toIcal() {
    let comp = new ICAL.Component(['vcalendar', [], []]);
    comp.updatePropertyWithValue('prodid', '-//iCal.js EteSync Web');
    comp.updatePropertyWithValue('version', '4.0');

    comp.addSubcomponent(this.component);
    return comp.toString();
  }

  clone() {
    const ret = new EventType(new ICAL.Component(this.component.toJSON()));
    ret.color = this.color;
    return ret;
  }
}

export class ContactType implements PimType {
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
