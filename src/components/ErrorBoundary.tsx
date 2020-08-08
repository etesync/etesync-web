// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import { IntegrityError } from "etebase";
import PrettyError from "../widgets/PrettyError";

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
    this.setState({ error });
  }

  public render() {
    const { error } = this.state;
    if (error) {
      if (error instanceof IntegrityError) {
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
        <div>
          <h2>Something went wrong!</h2>
          <PrettyError error={this.state.error} />
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
