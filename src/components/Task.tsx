import * as React from 'react';

import PimItemHeader from './PimItemHeader';

import { formatDate } from '../helpers';

import { TaskType } from '../pim-types';

class Task extends React.PureComponent {
  props: {
    item?: TaskType,
  };

  render() {
    if (this.props.item === undefined) {
      throw Error('Task should be defined!');
    }

    const { item } = this.props;

    const style = {
      content: {
        padding: 15,
      },
    };

    return (
      <React.Fragment>
        <PimItemHeader text={this.props.item.summary} backgroundColor={this.props.item.color}>
          { item.startDate &&
            <div>Start: {formatDate(item.startDate)}</div>
          }
          { item.dueDate &&
            <div>Due: {formatDate(item.dueDate)}</div>
          }
          <br/>
          <div><u>{this.props.item.location}</u></div>
        </PimItemHeader>
        <div style={style.content}>
          <div>{this.props.item.description}</div>
          {(this.props.item.attendees.length > 0) && (
            <div>Attendees: {this.props.item.attendees.map((x) => (x.getFirstValue())).join(', ')}</div>)}
        </div>
      </React.Fragment>
    );
  }
}

export default Task;
