declare module 'ical.js' {
  function parse(input: string): Array<any>;
  class Component {
    name: string;

    constructor(jCal: Array<any> | string, parent?: Component);

    getFirstSubcomponent(name?: string): Component | null;

    getFirstPropertyValue(name?: string): string;
  }

  class Event {
    uid: string;
    summary: string;

    constructor(component?: Component | null,
                options?: {strictExceptions: boolean, exepctions: Array<Component|Event>});
  }
}
