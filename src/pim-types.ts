// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as ICAL from "ical.js";
import * as zones from "./data/zones.json";
import moment from "moment";
import * as uuid from "uuid";

export const PRODID = "-//iCal.js EteSync iOS";

export interface PimType {
  uid: string;
  collectionUid?: string;
  itemUid?: string;
  toIcal(): string;
  clone(): PimType;
  lastModified: ICAL.Time | undefined;
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

  const component = new ICAL.Component("vtimezone");
  zone.ics.forEach((zonePart: string) => {
    component.addSubcomponent(new ICAL.Component(ICAL.parse(zonePart)));
  });
  component.addPropertyWithValue("tzid", timezone);

  const retZone = new ICAL.Timezone({
    component,
    tzid: timezone,
  });

  ICAL.TimezoneService.register(timezone, retZone);

  return retZone;
}

export function parseString(content: string) {
  content = content.replace(/^[a-zA-Z0-9]*\./gm, ""); // FIXME: ugly hack to ignore item groups.
  return new ICAL.Component(ICAL.parse(content));
}

export class EventType extends ICAL.Event implements PimType {
  public collectionUid?: string;
  public itemUid?: string;

  public static isEvent(comp: ICAL.Component) {
    return !!comp.getFirstSubcomponent("vevent");
  }

  public static fromVCalendar(comp: ICAL.Component) {
    const event = new EventType(comp.getFirstSubcomponent("vevent"));
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

  set title(title: string) {
    this.summary = title;
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

  get lastModified() {
    return this.component.getFirstPropertyValue("last-modified");
  }

  set lastModified(time: ICAL.Time) {
    this.component.updatePropertyWithValue("last-modified", time);
  }

  get rrule() {
    return this.component.getFirstPropertyValue("rrule");
  }

  set rrule(rule: ICAL.Recur) {
    this.component.updatePropertyWithValue("rrule", rule);
  }

  public toIcal() {
    const comp = new ICAL.Component(["vcalendar", [], []]);
    comp.updatePropertyWithValue("prodid", PRODID);
    comp.updatePropertyWithValue("version", "2.0");

    comp.addSubcomponent(this.component);
    ICAL.helpers.updateTimezones(comp);
    return comp.toString();
  }

  public clone() {
    const ret = new EventType(ICAL.Component.fromString(this.component.toString()));
    ret.color = this.color;
    ret.collectionUid = this.collectionUid;
    ret.itemUid = this.itemUid;
    return ret;
  }
}

export enum TaskStatusType {
  NeedsAction = "NEEDS-ACTION",
  Completed = "COMPLETED",
  InProcess = "IN-PROCESS",
  Cancelled = "CANCELLED",
}

export enum TaskPriorityType {
  Undefined = 0,
  High = 1,
  Medium = 5,
  Low = 9
}

export let TaskTags = ["Work", "Home"];

export function setTaskTags(tags: string[]) {
  TaskTags = tags;
}

export class TaskType extends EventType {
  public collectionUid?: string;
  public itemUid?: string;

  public static fromVCalendar(comp: ICAL.Component) {
    const task = new TaskType(comp.getFirstSubcomponent("vtodo"));
    // FIXME: we need to clone it so it loads the correct timezone and applies it
    timezoneLoadFromName(task.timezone);
    return task.clone();
  }

  public static parse(content: string) {
    return TaskType.fromVCalendar(parseString(content));
  }

  public color: string;

  constructor(comp?: ICAL.Component | null) {
    super(comp ? comp : new ICAL.Component("vtodo"));
  }

  get finished() {
    return this.status === TaskStatusType.Completed ||
      this.status === TaskStatusType.Cancelled;
  }

  set status(status: TaskStatusType) {
    this.component.updatePropertyWithValue("status", status);
  }

  get status(): TaskStatusType {
    return this.component.getFirstPropertyValue("status");
  }

  set priority(priority: TaskPriorityType) {
    this.component.updatePropertyWithValue("priority", priority);
  }

  get priority() {
    return this.component.getFirstPropertyValue("priority");
  }

  set tags(tags: string[]) {
    this.component.updatePropertyWithValue("categories", tags.join(","));
  }

  get tags() {
    const tags = this.component.getFirstPropertyValue("categories");
    return tags ? tags.split(",") : [];
  }

  set dueDate(date: ICAL.Time | undefined) {
    if (date) {
      this.component.updatePropertyWithValue("due", date);
    } else {
      this.component.removeAllProperties("due");
    }
  }

  get dueDate() {
    return this.component.getFirstPropertyValue("due");
  }

  set completionDate(date: ICAL.Time | undefined) {
    if (date) {
      this.component.updatePropertyWithValue("completed", date);
    } else {
      this.component.removeAllProperties("completed");
    }
  }

  get completionDate() {
    return this.component.getFirstPropertyValue("completed");
  }

  set relatedTo(parentUid: string | undefined) {
    if (parentUid !== undefined) {
      this.component.updatePropertyWithValue("related-to", parentUid);
    } else {
      this.component.removeAllProperties("related-to");
    }
  }

  get relatedTo(): string | undefined {
    return this.component.getFirstPropertyValue("related-to");
  }

  get endDate() {
    // XXX: A hack to override this as it shouldn't be used
    return undefined as any;
  }

  get allDay() {
    return !!((this.startDate?.isDate) || (this.dueDate?.isDate));
  }

  get dueToday() {
    return this.dueDate && moment(this.dueDate.toJSDate()).isSameOrBefore(moment(), "day");
  }

  get overdue() {
    if (!this.dueDate) {
      return false;
    }

    const dueDate = moment(this.dueDate.toJSDate());
    const now = moment();
    return (this.dueDate.isDate) ? dueDate.isBefore(now, "day") : dueDate.isBefore(now);
  }

  get hidden() {
    if (!this.startDate) {
      return false;
    }

    const startDate = moment(this.startDate.toJSDate());
    const now = moment();
    return startDate.isAfter(now);
  }

  public clone() {
    const ret = new TaskType(ICAL.Component.fromString(this.component.toString()));
    ret.color = this.color;
    return ret;
  }

  public getNextOccurence(): TaskType | null {
    if (!this.isRecurring()) {
      return null;
    }

    const rrule = this.rrule.clone();

    if (rrule.count && rrule.count <= 1) {
      return null; // end of reccurence
    }

    rrule.count = null; // clear count so we can iterate as many times as needed
    const recur = rrule.iterator(this.startDate ?? this.dueDate);
    let nextRecurrence = recur.next();
    while ((nextRecurrence = recur.next())) {
      if (nextRecurrence.compare(ICAL.Time.now()) > 0) {
        break;
      }
    }

    if (!nextRecurrence) {
      return null; // end of reccurence
    }

    const nextStartDate = this.startDate ? nextRecurrence : undefined;
    const nextDueDate = this.dueDate ? nextRecurrence : undefined;
    if (nextStartDate && nextDueDate) {
      const offset = this.dueDate!.subtractDateTz(this.startDate);
      nextDueDate.addDuration(offset);
    }

    const nextTask = this.clone();
    nextTask.uid = uuid.v4();
    if (nextStartDate) {
      nextTask.startDate = nextStartDate;
    }
    if (nextDueDate) {
      nextTask.dueDate = nextDueDate;
    }

    if (this.rrule.count) {
      rrule.count = this.rrule.count - 1;
      nextTask.rrule = rrule;
    }

    nextTask.status = TaskStatusType.NeedsAction;
    nextTask.lastModified = ICAL.Time.now();

    return nextTask;
  }
}

export class ContactType implements PimType {
  public comp: ICAL.Component;
  public collectionUid?: string;
  public itemUid?: string;


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
    return new ContactType(ICAL.Component.fromString(this.comp.toString()));
  }

  get uid() {
    return this.comp.getFirstPropertyValue("uid");
  }

  set uid(uid: string) {
    this.comp.updatePropertyWithValue("uid", uid);
  }

  get fn() {
    return this.comp.getFirstPropertyValue("fn");
  }

  get n() {
    return this.comp.getFirstPropertyValue("n");
  }

  get bday() {
    return this.comp.getFirstPropertyValue("bday");
  }

  get lastModified() {
    return this.comp.getFirstPropertyValue("rev");
  }

  get group() {
    const kind = this.comp.getFirstPropertyValue("kind");
    return ["group", "organization"].includes(kind);
  }

  get members() {
    return this.comp.getAllProperties("member").map((prop) => prop.getFirstValue<string>().replace("urn:uuid:", ""));
  }
}
