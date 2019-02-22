import * as React from 'react';

import PimItemHeader from './PimItemHeader';

import { formatDateRange } from '../helpers';

import { EventType } from '../pim-types';

class Event extends React.PureComponent {
  public props: {
    item?: EventType,
  };

  public render() {
    if (this.props.item === undefined) {
      throw Error('Event should be defined!');
    }

    const style = {
      content: {
        padding: 15,
      },
    };

    const timezone = this.props.item.timezone;

    return (
      <React.Fragment>
        <PimItemHeader text={this.props.item.summary} backgroundColor={this.props.item.color}>
          <div>{formatDateRange(this.props.item.startDate, this.props.item.endDate)} {timezone && <small>({timezone})</small>}</div>
          <br/>
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

export default Event;
