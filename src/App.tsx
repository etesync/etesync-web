import * as React from 'react';
import { Router } from 'react-router';
import './App.css';

import createBrowserHistory from 'history/createBrowserHistory';
const customHistory = createBrowserHistory();

const logo = require('./logo.svg');

class App extends React.Component {
  render() {
    return (
      <Router history={customHistory}>
        <div className="App">
          <div className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h2>Welcome to React</h2>
          </div>
          <p className="App-intro">
            To get started, edit <code>src/App.tsx</code> and save to reload.
          </p>
        </div>
      </Router>
    );
  }
}

export default App;
