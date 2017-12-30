import * as React from 'react';
import { pure } from 'recompose';

export const PrettyError = pure((props: any) => (
  <div>
    <h2>Something went wrong!</h2>
    <pre>
      {props.error.message}
    </pre>

    <h3>Stack trace:</h3>
    <pre>
      {props.error.stack}
    </pre>
  </div>
));

export default PrettyError;
