import { createStore, applyMiddleware } from 'redux';
import { persistStore } from 'redux-persist';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import promiseMiddleware from './promise-middleware';

import reducers from './reducers';
import { CredentialsTypeRemote, JournalsType, EntriesType, UserInfoType } from './reducers';

// Workaround babel limitation
export * from './reducers';

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsTypeRemote;
  encryptionKey: {key: string};
  cache: {
    journals: JournalsType;
    entries: EntriesType;
    userInfo: UserInfoType;
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
