// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { createStore, applyMiddleware } from "redux";
import { persistStore } from "redux-persist";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import { ActionMeta } from "redux-actions";
import { useDispatch } from "react-redux";

import promiseMiddleware from "./promise-middleware";

import reducers from "./construct";

// Workaround babel limitation
export * from "./reducers";
export * from "./construct";

const middleware = [
  thunkMiddleware,
  promiseMiddleware,
];

if (process.env.NODE_ENV === "development") {
  middleware.push(createLogger());
}

// FIXME: Hack, we don't actually return a promise when one is not passed.
export function asyncDispatch<T, V>(action: ActionMeta<Promise<T> | T, V>): Promise<ActionMeta<T, V>> {
  return store.dispatch(action) as any;
}

export function useAsyncDispatch() {
  const dispatch = useDispatch();
  return function (action: any): any {
    return dispatch(action) as any;
  } as typeof asyncDispatch;
}

export const store = createStore(
  reducers,
  applyMiddleware(...middleware)
);

export const persistor = persistStore(store, { manualPersist: true } as any);
