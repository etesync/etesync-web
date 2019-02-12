import * as React from 'react';
import { Location, History } from 'history';
import { Route, Switch } from 'react-router';

import Journal from './Journal';
import JournalsList from './JournalsList';

import AppBarOverride from '../widgets/AppBarOverride';
import { routeResolver } from '../App';

import { JournalsData, UserInfoData, CredentialsData } from '../store';
import { SyncInfo } from '../SyncGate';

class Journals extends React.PureComponent {
  props: {
    etesync: CredentialsData;
    journals: JournalsData;
    userInfo: UserInfoData;
    syncInfo: SyncInfo;
    history: History;
    location: Location;
  };

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <Route
          path={routeResolver.getRoute('journals')}
          exact={true}
          render={({ history }) => (
            <>
              <AppBarOverride title="Journals" />
              <JournalsList
                userInfo={this.props.userInfo}
                etesync={this.props.etesync}
                journals={this.props.journals}
                history={history}
              />
            </>
          )}
        />
        <Route
          path={routeResolver.getRoute('journals._id')}
          render={({match}) => (
            <Journal
              syncInfo={this.props.syncInfo}
              match={match}
            />
          )}
        />
      </Switch>
    );
  }
}

export default Journals;
