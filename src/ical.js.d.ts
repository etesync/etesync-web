declare module 'ical.js' {
  function parse(input: string): Array<any>;
  class Component {
    name: string;

    constructor(jCal: Array<any> | string, parent?: Component);

    getFirstSubcomponent(name?: string): Component | null;

    getFirstPropertyValue(name?: string): string;

    getAllProperties(name?: string): Array<Property>;
  }

  class Event {
    uid: string;
    summary: string;
    startDate: Time;
    endDate: Time;
    description: string;
    location: string;
    attendees: Array<Property>;

    constructor(component?: Component | null,
                options?: {strictExceptions: boolean, exepctions: Array<Component|Event>});
  }

  class Property {
    name: string;
    type: string;

    getFirstValue(): string;
    getValues(): Array<any>;
    toJSON(): any;
  }

  class Time {
    isDate: boolean;

    toJSDate(): Date;
  }
}
