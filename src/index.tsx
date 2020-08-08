// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/es/integration/react";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import "./index.css";

import * as Etebase from "etebase";

function MyPersistGate(props: React.PropsWithChildren<{}>) {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Etebase.ready.then(() => {
      setLoading(false);
      persistor.persist();
    });
  }, []);

  if (loading) {
    return (<React.Fragment />);
  }

  return (
    <PersistGate persistor={persistor}>
      {props.children}
    </PersistGate>
  );
}

import { store, persistor } from "./store";

ReactDOM.render(
  <Provider store={store}>
    <MyPersistGate>
      <App />
    </MyPersistGate>
  </Provider>,
  document.getElementById("root") as HTMLElement
);
registerServiceWorker();
