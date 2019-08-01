import * as React from 'react';
import { Route, Switch, withRouter } from 'react-router';

import * as EteSync from '../api/EteSync';

import { routeResolver } from '../App';

import { History } from 'history';

function objValues(obj: any) {
  return Object.keys(obj).map((x) => obj[x]);
}

export function journalView(JournalList: any, JournalItem: any) {
  return withRouter(class extends React.PureComponent {
    public props: {
      journal: EteSync.Journal,
      entries: {[key: string]: any},
      history?: History,
    };

    constructor(props: any) {
      super(props);
      this.itemClicked = this.itemClicked.bind(this);
    }

    public itemClicked(contact: any) {
      const uid = contact.uid;

      this.props.history!.push(
        routeResolver.getRoute('journals._id.items._id', { journalUid: this.props.journal.uid, itemUid: uid }));
    }

    public render() {
      const items = this.props.entries;

      return (
        <Switch>
          <Route
            path={routeResolver.getRoute('journals._id')}
            exact
            render={() => (
              <JournalList entries={objValues(items)} onItemClick={this.itemClicked} />
              )
            }
          />
          <Route
            path={routeResolver.getRoute('journals._id.items._id')}
            exact
            render={({match}) => {

              return (
                <JournalItem item={items[`${match.params.journalUid}|${match.params.itemUid}`]} />
              );
            }}
          />
        </Switch>
      );
    }
  });
}

export default journalView;
