import * as React from 'react';

export const PrettyError = React.memo((props: any) => (
  <div>
    <pre style={{ fontWeight: 'bold' }}>
      {props.error.message}
    </pre>

    <pre>
      {props.error.stack}
    </pre>
  </div>
));

export default PrettyError;
