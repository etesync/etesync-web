declare module 'ical.js' {
  function parse(input: string): Array<any>;
  class Component {
    name: string;

    static fromString(str: string): Component;

    constructor(jCal: Array<any> | string, parent?: Component);

    toJSON(): Array<any>;

    getFirstSubcomponent(name?: string): Component | null;

    getFirstPropertyValue(name?: string): any;

    getFirstProperty(name?: string): Property;
    getAllProperties(name?: string): Array<Property>;

    addProperty(property: Property): Property;
    addPropertyWithValue(name: string, value: string | number | object): Property;

    updatePropertyWithValue(name: string, value: string | number | object): Property;

    removeAllProperties(name?: string): boolean;

    addSubcomponent(component: Component): Component;
  }

  class Event {
    uid: string;
    summary: string;
    startDate: Time;
    endDate: Time;
    description: string;
    location: string;
    attendees: Array<Property>;

    component: Component;

    isRecurring(): boolean;
    iterator(startTime?: Time): RecurExpansion;

    constructor(component?: Component | null,
                options?: {strictExceptions: boolean, exepctions: Array<Component|Event>});
  }

  class Property {
    name: string;
    type: string;

    constructor(jCal: Array<any> | string, parent?: Component);

    getFirstValue(): any;
    getValues(): Array<any>;

    setParameter(name: string, value: string | Array<string>): void;
    setValue(value: string | object): void;
    toJSON(): any;
  }

  type TimeJsonData = {
    year?: number,
    month?: number,
    day?: number,
    hour?: number,
    minute?: number,
    second?: number,
    isDate?: boolean
  };

  class Time {
    isDate: boolean;
    timezone: string;
    zone: Timezone;

    static fromString(str: string): Time;
    static fromJSDate(aDate: Date | null, useUTC: boolean): Time;
    static fromData(aData: TimeJsonData): Time;

    static now(): Time;

    constructor(data?: TimeJsonData);

    compare(aOther: Time): number;

    clone(): Time;

    adjust(
      aExtraDays: number, aExtraHours: number, aExtraMinutes: number, aExtraSeconds: number, aTimeopt?: Time): void;

    addDuration(aDuration: Duration): void;
    subtractDateTz(aDate: Time): Duration;

    toJSDate(): Date;
    toJSON(): TimeJsonData;
  }

  class Duration {
    days: number;
  }

  class RecurExpansion {
    complete: boolean;

    next(): Time;
  }

  class Timezone {
    static localTimezone: Timezone;
    static convert_time(tt: Time, from_zone: Timezone, to_zone: Timezone): Time;

    tzid: string;
  }
}
