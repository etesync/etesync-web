// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import PimItemHeader from './PimItemHeader';

import { formatDate, formatOurTimezoneOffset } from '../helpers';

import { TaskType } from '../pim-types';

class Task extends React.PureComponent {
  public props: {
    item?: TaskType;
  };

  public render() {
    if (this.props.item === undefined) {
      throw Error('Task should be defined!');
    }

    const { item } = this.props;

    const style = {
      content: {
        padding: 15,
      },
    };

    const timezone = this.props.item.timezone;

    return (
      <React.Fragment>
        <PimItemHeader text={this.props.item.summary} backgroundColor={this.props.item.color}>
          {item.startDate &&
            <div>Start: {formatDate(item.startDate)} {timezone && <small>({formatOurTimezoneOffset()})</small>}</div>
          }
          {item.dueDate &&
            <div>Due: {formatDate(item.dueDate)} {timezone && <small>({formatOurTimezoneOffset()})</small>}</div>
          }
          <br />
          <div><u>{this.props.item.location}</u></div>
        </PimItemHeader>
        <div style={style.content}>
          <pre>{this.props.item.description}</pre>
          {(this.props.item.attendees.length > 0) && (
            <div>Attendees: {this.props.item.attendees.map((x) => (x.getFirstValue())).join(', ')}</div>)}
        </div>
      </React.Fragment>
    );
  }
}

export default Task;
