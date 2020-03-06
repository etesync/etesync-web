// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import { withRouter } from 'react-router';

// FIXME: Should probably tie this to the history object, or at least based on the depth of the history
const stateCache = {};

type Constructor<T> = new(...args: any[]) => T;

export function historyPersistor(tag: string) {
  return <T extends Constructor<React.Component>>(Base: T) => {
    return withRouter(class extends Base {
      constructor(...rest: any[]) {
        const props = rest[0];
        super(...rest);
        const tagName = this.getKeyForTag(props, tag);
        if (tagName in stateCache) {
          this.state = stateCache[tagName];
        }
      }

      public componentWillUnmount() {
        if (super.componentWillUnmount) {
          super.componentWillUnmount();
        }
        stateCache[this.getKeyForTag(this.props, tag)] = this.state;
      }

      public getKeyForTag(props: any, tagName: string) {
        return props.location.pathname + ':' + tagName;
      }
    });
  };
}
