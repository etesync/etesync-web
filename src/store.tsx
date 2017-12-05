import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import session from 'redux-persist/lib/storage/session';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import * as EteSync from './api/EteSync';

const loggerMiddleware = createLogger();

enum Actions {
  FETCH_CREDENTIALS = 'FETCH_CREDENTIALS',
  FETCH_JOURNALS = 'FETCH_JOURNALS',
}

export enum FetchStatus {
  Initial = 'INITIAL',
  Request = 'REQUEST',
  Failure = 'FAILURE',
  Success = 'SUCCESS',
}

export interface FetchType<T> {
  status: FetchStatus;
  value: T | null;
  error?: Error;
}

export interface CredentialsData {
  serviceApiUrl: string;
  credentials: EteSync.Credentials;
  encryptionKey: string;
}

export type CredentialsType = FetchType<CredentialsData>;

export type JournalsData = Array<EteSync.Journal>;

export type JournalsType = FetchType<JournalsData>;

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsType;
  cache: {
    journals: JournalsType;
  };
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

export function journalsSuccess(value: JournalsData) {
  return {
    type: Actions.FETCH_JOURNALS,
    status: FetchStatus.Success,
    journals: value,
  };
}

export function journalsRequest() {
  return {
    type: Actions.FETCH_JOURNALS,
    status: FetchStatus.Request,
  };
}

export function journalsFailure(error: Error) {
  return {
    type: Actions.FETCH_JOURNALS,
    status: FetchStatus.Failure,
    error
  };
}

export function logout() {
  return {
    type: Actions.FETCH_CREDENTIALS,
    status: FetchStatus.Initial,
  };
}

function credentials(state: CredentialsType = {status: FetchStatus.Initial, value: null},
                     action: any): CredentialsType {
  switch (action.type) {
    case Actions.FETCH_CREDENTIALS:
      switch (action.status) {
        case FetchStatus.Success:
          return {
            status: action.status,
            value: action.credentials,
          };
        case FetchStatus.Failure:
          return {
            status: action.status,
            value: null,
            error: action.error,
          };
        default:
          return {
            status: action.status,
            value: null,
          };
      }
    default:
      return state;
  }
}

function journals(state: JournalsType = {status: FetchStatus.Initial, value: null}, action: any) {
  switch (action.type) {
    case Actions.FETCH_JOURNALS:
      switch (action.status) {
        case FetchStatus.Success:
          return {
            status: action.status,
            value: action.journals,
          };
        case FetchStatus.Failure:
          return {
            status: action.status,
            value: null,
            error: action.error,
          };
        default:
          return {
            status: action.status,
            value: null,
          };
      }
    default:
      return state;
  }
}

function fetchCount(state: number = 0, action: any) {
  if ('status' in action) {
    switch (action.status) {
      case FetchStatus.Request:
        return state + 1;
      case FetchStatus.Success:
      case FetchStatus.Failure:
        return state - 1;
      default:
        return state;
    }
  }
  switch (action.type) {
    default:
      return state;
  }
}

const credentialsPersistConfig = {
  key: 'credentials',
  storage: session,
  whitelist: ['value'],
};

const reducers = combineReducers({
  fetchCount,
  credentials: persistReducer(credentialsPersistConfig, credentials),
  cache: combineReducers({
    journals
  })
});

export const store = createStore(
  reducers,
  applyMiddleware(
    thunkMiddleware,
    loggerMiddleware
  )
);

export const persistor = persistStore(store);
