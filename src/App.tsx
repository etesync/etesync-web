import * as React from 'react';
import { HashRouter } from 'react-router-dom';
import './App.css';

import { JournalList } from './JournalList';

class App extends React.Component {
  render() {
    return (
      <HashRouter>
        <JournalList />
      </HashRouter>
    );
  }
}

export default App;
