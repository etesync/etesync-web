import * as React from 'react';
import { HashRouter } from 'react-router-dom';
import './App.css';

import { EteSyncContext } from './EteSyncContext';
import { RouteResolver } from './routes';

export const routeResolver = new RouteResolver({
  home: '',
  journals: {
    _base: 'journals',
    _id: {
      _base: ':journalUid',
      entries: {
        _base: 'entries',
        _id: {
          _base: ':entryUid',
        },
      },
    },
  },
});

class App extends React.Component {
  render() {
    return (
      <HashRouter>
        <EteSyncContext />
      </HashRouter>
    );
  }
}

export default App;
