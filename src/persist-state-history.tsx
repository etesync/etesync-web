import * as React from 'react';
import { withRouter } from 'react-router';

// FIXME: Should probably tie this to the history object, or at least based on the depth of the history
let stateCache = {};

type Constructor<T> = new(...args: any[]) => T;

export function historyPersistor<T extends Constructor<React.Component>>(Base: T, tag: string) {
  return withRouter(class extends Base {
    constructor(...rest: any[]) {
      const props = rest[0];
      super(...rest);
      const tagName = this.getKeyForTag(props, tag);
      if (tagName in stateCache) {
        this.state = stateCache[tagName];
      }
    }

    componentWillUnmount() {
      if (super.componentWillUnmount) {
        super.componentWillUnmount();
      }
      stateCache[this.getKeyForTag(this.props, tag)] = this.state;
    }

    getKeyForTag(props: any, tagName: string) {
      return props.location.pathname + ':' + tagName;
    }
  });
}
