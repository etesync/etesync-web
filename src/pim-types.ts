import * as ICAL from 'ical.js';
import * as zones from './data/zones.json';

export const PRODID = '-//iCal.js EteSync iOS';

export interface PimType {
  uid: string;
  toIcal(): string;
  clone(): PimType;
}

export function timezoneLoadFromName(timezone: string | null) {
  if (!timezone) {
    return null;
  }

  let zone = zones.zones[timezone];
  if (!zone && zones.aliases[timezone]) {
    zone = zones.zones[zones.aliases[timezone]];
  }

  if (!zone) {
    return null;
  }

  if (ICAL.TimezoneService.has(timezone)) {
    return ICAL.TimezoneService.get(timezone);
  }

  const component = new ICAL.Component('vtimezone');
  zone.ics.forEach((zonePart: string) => {
    component.addSubcomponent(new ICAL.Component(ICAL.parse(zonePart)));
  });
  component.addPropertyWithValue('tzid', timezone);

  const retZone = new ICAL.Timezone({
    component,
    tzid: timezone,
  });

  ICAL.TimezoneService.register(timezone, retZone);

  return retZone;
}

export function parseString(content: string) {
  content = content.replace(/^[a-zA-Z0-9]*\./gm, ''); // FIXME: ugly hack to ignore item groups.
  return new ICAL.Component(ICAL.parse(content));
}

export class EventType extends ICAL.Event implements PimType {
  public static isEvent(comp: ICAL.Component) {
    return !!comp.getFirstSubcomponent('vevent');
  }

  public static fromVCalendar(comp: ICAL.Component) {
    const event = new EventType(comp.getFirstSubcomponent('vevent'));
    // FIXME: we need to clone it so it loads the correct timezone and applies it
    timezoneLoadFromName(event.timezone);
    return event.clone();
  }

  public static parse(content: string) {
    return EventType.fromVCalendar(parseString(content));
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
    comp.updatePropertyWithValue('prodid', PRODID);
    comp.updatePropertyWithValue('version', '2.0');

    comp.addSubcomponent(this.component);
    ICAL.helpers.updateTimezones(comp);
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
    const task = new TaskType(comp.getFirstSubcomponent('vtodo'));
    // FIXME: we need to clone it so it loads the correct timezone and applies it
    timezoneLoadFromName(task.timezone);
    return task.clone();
  }

  public static parse(content: string) {
    return TaskType.fromVCalendar(parseString(content));
  }

  public color: string;

  constructor(comp?: ICAL.Component | null) {
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

  set completionDate(date: ICAL.Time | undefined) {
    if (date) {
      this.component.updatePropertyWithValue('completed', date);
    } else {
      this.component.removeAllProperties('completed');
    }
  }

  get completionDate() {
    return this.component.getFirstPropertyValue('completed');
  }

  get endDate() {
    // XXX: A hack to override this as it shouldn't be used
    return undefined as any;
  }

  get allDay() {
    return !!((this.startDate?.isDate) || (this.dueDate?.isDate));
  }

  public clone() {
    const ret = new TaskType(new ICAL.Component(this.component.toJSON()));
    ret.color = this.color;
    return ret;
  }
}

export class ContactType implements PimType {
  public comp: ICAL.Component;

  public static parse(content: string) {
    return new ContactType(parseString(content));
  }

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

  get group() {
    const kind = this.comp.getFirstPropertyValue('kind');
    return kind in ['group', 'organization'];
  }
}
