import * as React from 'react';
import { Router } from 'react-router';
import './App.css';

import { JournalList } from './JournalList';

import createBrowserHistory from 'history/createBrowserHistory';
const customHistory = createBrowserHistory();

class App extends React.Component {
  render() {
    return (
      <Router history={customHistory}>
        <JournalList />
      </Router>
    );
  }
}

export default App;
