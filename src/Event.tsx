import * as React from 'react';

import * as ICAL from 'ical.js';

class Event extends React.Component {
  props: {
    event?: ICAL.Event,
  };

  render() {
    if (this.props.event === undefined) {
      throw Error('Event should be defined!');
    }

    return (
      <div>
        <h3>{this.props.event.summary}</h3>
      </div>
    );
  }
}

export default Event;
