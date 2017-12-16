import * as React from 'react';
import { Route, Switch, withRouter } from 'react-router';

import { routeResolver } from '../App';

import { historyPersistor } from '../persist-state-history';

import Calendar from '../components/Calendar';
import Event from '../components/Event';

import { EventType } from '../pim-types';

import * as EteSync from '../api/EteSync';

function objValues(obj: any) {
  return Object.keys(obj).map((x) => obj[x]);
}

class JournalCalendar extends React.PureComponent {
  props: {
    journal: EteSync.Journal,
    entries: {[key: string]: EventType},
    history?: any,
  };

  constructor(props: any) {
    super(props);
    this.eventClicked = this.eventClicked.bind(this);
  }

  eventClicked(event: EventType) {
    const uid = event.uid;

    this.props.history.push(
      routeResolver.getRoute('journals._id.items._id', { journalUid: this.props.journal.uid, itemUid: uid }));
  }

  render() {
    const PersistCalendar = historyPersistor('Calendar')(Calendar);
    let items = this.props.entries;

    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('journals._id')}
          exact={true}
          render={() => (
              <PersistCalendar entries={objValues(items)} onItemClick={this.eventClicked} />
            )
          }
        />
        <Route
          path={routeResolver.getRoute('journals._id.items._id')}
          exact={true}
          render={({match}) => (
            <Event event={items[match.params.itemUid]} />
          )}
        />
      </Switch>
    );
  }
}

export default withRouter(JournalCalendar);
