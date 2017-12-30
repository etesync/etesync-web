import * as React from 'react';

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
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      return (
        <PrettyError error={this.state.error} />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
