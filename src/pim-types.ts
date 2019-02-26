import * as ICAL from 'ical.js';

export interface PimType {
  uid: string;
  toIcal(): string;
  clone(): PimType;
}

export class EventType extends ICAL.Event implements PimType {
  public static isEvent(comp: ICAL.Component) {
    return !!comp.getFirstSubcomponent('vevent');
  }

  public static fromVCalendar(comp: ICAL.Component) {
    return new EventType(comp.getFirstSubcomponent('vevent'));
  }

  public color: string;

  get timezone() {
    if (this.startDate) {
      return this.startDate.timezone;
    } else if (this.endDate) {
      return this.endDate.timezone;
    }

    return null;
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

  public toIcal() {
    const comp = new ICAL.Component(['vcalendar', [], []]);
    comp.updatePropertyWithValue('prodid', '-//iCal.js EteSync Web');
    comp.updatePropertyWithValue('version', '4.0');

    comp.addSubcomponent(this.component);
    return comp.toString();
  }

  public clone() {
    const ret = new EventType(new ICAL.Component(this.component.toJSON()));
    ret.color = this.color;
    return ret;
  }
}

export enum TaskStatusType {
  NeedsAction = 'NEEDS-ACTION',
  Completed = 'COMPLETED',
  InProcess = 'IN-PROCESS',
  Cancelled = 'CANCELLED',
}

export class TaskType extends EventType {
  public static fromVCalendar(comp: ICAL.Component) {
    return new TaskType(comp.getFirstSubcomponent('vtodo'));
  }

  public color: string;

  constructor(comp: ICAL.Component | null) {
    super(comp ? comp : new ICAL.Component('vtodo'));
  }

  get finished() {
    return this.status === TaskStatusType.Completed ||
      this.status === TaskStatusType.Cancelled;
  }

  set status(status: TaskStatusType) {
      this.component.updatePropertyWithValue('status', status);
  }

  get status(): TaskStatusType {
    return this.component.getFirstPropertyValue('status');
  }

  set dueDate(date: ICAL.Time | undefined) {
    if (date) {
      this.component.updatePropertyWithValue('due', date);
    } else {
      this.component.removeAllProperties('due');
    }
  }

  get dueDate() {
    return this.component.getFirstPropertyValue('due');
  }

  get endDate() {
    // XXX: A hack to override this as it shouldn't be used
    return undefined as any;
  }

  get allDay() {
    return !!((this.startDate && this.startDate.isDate) || (this.dueDate && this.dueDate.isDate));
  }

  public clone() {
    const ret = new TaskType(new ICAL.Component(this.component.toJSON()));
    ret.color = this.color;
    return ret;
  }
}

export class ContactType implements PimType {
  public comp: ICAL.Component;

  constructor(comp: ICAL.Component) {
    this.comp = comp;
  }

  public toIcal() {
    return this.comp.toString();
  }

  public clone() {
    return new ContactType(new ICAL.Component(this.comp.toJSON()));
  }

  get uid() {
    return this.comp.getFirstPropertyValue('uid');
  }

  get fn() {
    return this.comp.getFirstPropertyValue('fn');
  }
}
