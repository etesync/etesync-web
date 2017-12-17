import { createStore, applyMiddleware } from 'redux';
import { persistStore } from 'redux-persist';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import promiseMiddleware from './promise-middleware';

import reducers from './reducers';
import { CredentialsTypeRemote, JournalsType, EntriesType } from './reducers';

export { CredentialsType, CredentialsData, JournalsType, JournalsData, EntriesType, EntriesData } from './reducers';

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsTypeRemote;
  encryptionKey: {key: string};
  cache: {
    journals: JournalsType;
    entries: EntriesType;
  };
}

let middleware = [
  thunkMiddleware,
  promiseMiddleware,
];

if (process.env.NODE_ENV === 'development') {
  middleware.push(createLogger());
}

export const store = createStore(
  reducers,
  applyMiddleware(...middleware)
);

export const persistor = persistStore(store);
