import * as React from 'react';
import Paper from 'material-ui/Paper';

import './Container.css';

export default ({children}: {children: any}) => (
  <div className="Container">
    <Paper zDepth={2}>
      <div className="Container-inner">
        {children}
      </div>
    </Paper>
  </div>
);
