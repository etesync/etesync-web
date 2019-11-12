import * as React from 'react';

import { store, persistor } from '../store';
import { resetKey } from '../store/actions';

import { EncryptionPasswordError, IntegrityError } from 'etesync';
import PrettyError from '../widgets/PrettyError';

interface PropsType {
  children: React.ReactNode | React.ReactNode[];
}

class ErrorBoundary extends React.Component<PropsType> {
  public state: {
    error?: Error;
  };

  constructor(props: PropsType) {
    super(props);
    this.state = { };
  }

  public componentDidCatch(error: Error, _info: any) {
    if (error instanceof EncryptionPasswordError) {
      store.dispatch(resetKey());
    } else if (error instanceof IntegrityError) {
      persistor.purge();
    }

    this.setState({ error });
  }

  public render() {
    const { error } = this.state;
    if (error) {
      if (error instanceof EncryptionPasswordError) {
        return (
          <div>
            <h2>Wrong Encryption Password</h2>
            <p>
              It looks like you've entered the wrong encryption password, please refresh the page and try again.
            </p>
          </div>
        );
      } else if (error instanceof IntegrityError) {
        return (
          <div>
            <h2>Integrity Error</h2>
            <p>
              Please log out from the menu, refresh the page and try again, and if the problem persists, contact support.
            </p>
            <pre>
              {error.message}
            </pre>
          </div>
        );
      }
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
