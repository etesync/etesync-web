import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import session from 'redux-persist/lib/storage/session';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import * as EteSync from './api/EteSync';

const loggerMiddleware = createLogger();

enum Actions {
  FETCH_CREDENTIALS = 'FETCH_CREDENTIALS',
}

export enum FetchStatus {
  Initial = 'INITIAL',
  Request = 'REQUEST',
  Failure = 'FAILURE',
  Success = 'SUCCESS',
}

export interface CredentialsData {
  serviceApiUrl: string;
  credentials: EteSync.Credentials;
  encryptionKey: string;
}

export interface CredentialsType {
  status: FetchStatus;
  error?: Error;
  credentials?: CredentialsData;
}

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsData;
}

export function credentialsSuccess(creds: CredentialsData) {
  return {
    type: Actions.FETCH_CREDENTIALS,
    status: FetchStatus.Success,
    credentials: creds,
  };
}

export function credentialsRequest() {
  return {
    type: Actions.FETCH_CREDENTIALS,
    status: FetchStatus.Request,
  };
}

export function credentialsFailure(error: Error) {
  return {
    type: Actions.FETCH_CREDENTIALS,
    status: FetchStatus.Failure,
    error
  };
}

function credentials(state: CredentialsType = {status: FetchStatus.Initial}, action: any) {
  switch (action.type) {
    case Actions.FETCH_CREDENTIALS:
      if (action.status === FetchStatus.Success) {
        return {
          status: action.status,
          credentials: action.credentials,
        };
      } else {
        return {
          status: action.status,
        };
      }
    default:
      return state;
  }
}

function fetchCount(state: number = 0, action: any) {
  // FIXME: Make it automatic by action properties.
  switch (action.type) {
    case Actions.FETCH_CREDENTIALS:
      if (action.status === FetchStatus.Request) {
        return state + 1;
      } else {
        return state - 1;
      }
    default:
      return state;
  }
}

const credentialsPersistConfig = {
  key: 'credentials',
  storage: session,
  whitelist: ['credentials'],
};

const reducers = combineReducers({
  fetchCount,
  credentials: persistReducer(credentialsPersistConfig, credentials),
});

export const store = createStore(
  reducers,
  applyMiddleware(
    thunkMiddleware,
    loggerMiddleware
  )
);

export const persistor = persistStore(store);
