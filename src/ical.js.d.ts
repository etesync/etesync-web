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

    updatePropertyWithValue(name: string, value: string | number | object): Property;

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

    constructor(component?: Component | null,
                options?: {strictExceptions: boolean, exepctions: Array<Component|Event>});
  }

  class Property {
    name: string;
    type: string;

    getFirstValue(): any;
    getValues(): Array<any>;
    toJSON(): any;
  }

  class Time {
    isDate: boolean;

    static fromString(str: string): Time;

    constructor(data?: {
      year?: number,
      month?: number,
      day?: number,
      hour?: number,
      minute?: number,
      second?: number,
      isDate?: boolean
    });

    fromJSDate(aDate: Date | null, useUTC: boolean): void;

    toJSDate(): Date;
  }
}
