import * as React from 'react';

import { persistor } from '../store';

import { IntegrityError } from '../api/EteSync';
import PrettyError from '../widgets/PrettyError';

class ErrorBoundary extends React.Component {
  state: {
    error?: Error;
  };

  constructor(props: any) {
    super(props);
    this.state = { };
  }

  componentDidCatch(error: Error, info: any) {
    if (error instanceof IntegrityError) {
      persistor.purge();
    }

    this.setState({ error });
  }

  render() {
    const { error } = this.state;
    if (error && error instanceof IntegrityError) {
      return (
        <div>
          <h2>Integrity Error</h2>
          <p>
            This probably means you put in the wrong encryption password.
          </p>
          <p>
            Please log out from the menu, refresh the page and try again.
          </p>
          <pre>
            {error.message}
          </pre>
        </div>
      );
    }

    if (error) {
      return (
        <PrettyError error={this.state.error} />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
