import * as React from 'react';
import { HashRouter } from 'react-router-dom';
import { Switch, Route } from 'react-router';
import './App.css';

import { JournalList } from './JournalList';
import { JournalView } from './JournalView';
import { RouteResolver, RouteKeysType } from './routes';

interface RouteItem {
  path: string;
  exact?: boolean;
  keys?: RouteKeysType;
  name: string;
  component: React.ComponentType<any>;
}

const navigationRoutes: RouteItem[] = [
  {
    path: 'home',
    exact: true,
    name: 'Home',
    component: JournalList,
  },
  {
    path: 'journals._id',
    exact: true,
    name: 'Journal',
    component: JournalView,
  },
];

const routeResolver = new RouteResolver({
  home: '',
  journals: {
    _base: 'journals',
    _id: {
      _base: ':journalUid',
    },
  },
});

class App extends React.Component {
  render() {
    return (
      <HashRouter>
        <Switch>
          {navigationRoutes.map((route, index) => (
            <Route
              key={index}
              path={routeResolver.getRoute(route.path)}
              exact={route.exact}
              component={route.component}
            />
          ))}
        </Switch>
      </HashRouter>
    );
  }
}

export default App;
