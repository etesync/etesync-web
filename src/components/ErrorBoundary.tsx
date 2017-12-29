import * as React from 'react';

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
        <div>
          <h2>Something went wrong!</h2>
          <pre>
            {this.state.error.message}
          </pre>

          <h3>Stack trace:</h3>
          <pre>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
