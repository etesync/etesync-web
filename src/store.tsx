import { createStore, combineReducers, applyMiddleware } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import session from 'redux-persist/lib/storage/session';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import promiseMiddleware from './promise-middleware';

import * as EteSync from './api/EteSync';

const loggerMiddleware = createLogger();

enum Actions {
  FETCH_CREDENTIALS = 'FETCH_CREDENTIALS',
  FETCH_JOURNALS = 'FETCH_JOURNALS',
  FETCH_ENTRIES = 'FETCH_ENTRIES',
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

export type EntriesData = Array<EteSync.Entry>;

export type EntriesType = {[key: string]: FetchType<EntriesData>};

export interface StoreState {
  fetchCount: number;
  credentials: CredentialsType;
  cache: {
    journals: JournalsType;
    entries: EntriesType;
  };
}

function credentialsSuccess(creds: CredentialsData) {
  return {
    type: Actions.FETCH_CREDENTIALS,
    status: FetchStatus.Success,
    credentials: creds,
  };
}

function credentialsRequest() {
  return {
    type: Actions.FETCH_CREDENTIALS,
    status: FetchStatus.Request,
  };
}

function credentialsFailure(error: Error) {
  return {
    type: Actions.FETCH_CREDENTIALS,
    status: FetchStatus.Failure,
    error
  };
}

export function fetchCredentials(username: string, password: string, encryptionPassword: string, server: string) {
    const authenticator = new EteSync.Authenticator(server);

    return (dispatch: any) => {
      dispatch(credentialsRequest());

      authenticator.getAuthToken(username, password).then(
        (authToken) => {
          const creds = new EteSync.Credentials(username, authToken);
          const derived = EteSync.deriveKey(username, encryptionPassword);

          const context = {
            serviceApiUrl: server,
            credentials: creds,
            encryptionKey: derived,
          };

          dispatch(credentialsSuccess(context));
        },
        (error) => {
          dispatch(credentialsFailure(error));
        }
      );
    };
}

export function fetchJournals(etesync: CredentialsData) {
  const creds = etesync.credentials;
  const apiBase = etesync.serviceApiUrl;
  let journalManager = new EteSync.JournalManager(creds, apiBase);

  return {
    type: Actions.FETCH_JOURNALS,
    payload: journalManager.list(),
  };
}

export function fetchEntries(etesync: CredentialsData, journalUid: string, prevUid: string | null) {
  const creds = etesync.credentials;
  const apiBase = etesync.serviceApiUrl;
  let entryManager = new EteSync.EntryManager(creds, apiBase, journalUid);

  return {
    type: Actions.FETCH_ENTRIES,
    payload: entryManager.list(prevUid),
    meta: { journal: journalUid, prevUid },
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
      if (action.error) {
        return {
          value: null,
          error: action.payload,
        };
      } else {
        return {
          value: (action.payload === undefined) ? null : action.payload,
        };
      }
    default:
      return state;
  }
}

function entries(state: EntriesType = {}, action: any) {
  switch (action.type) {
    case Actions.FETCH_ENTRIES:
      if (action.error) {
        return { ...state,
            [action.meta.journal]: {
              value: null,
              error: action.payload,
            },
        };
      } else {
        return { ...state,
            [action.meta.journal]: {
              value: (action.payload === undefined) ? null : action.payload,
            },
        };
      }
    default:
      return state;
  }
}

function fetchCount(state: number = 0, action: any) {
  switch (action.type) {
    case Actions.FETCH_JOURNALS:
    case Actions.FETCH_ENTRIES:
      if (action.payload === undefined) {
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
  whitelist: ['value'],
};

const reducers = combineReducers({
  fetchCount,
  credentials: persistReducer(credentialsPersistConfig, credentials),
  cache: combineReducers({
    journals,
    entries,
  })
});

export const store = createStore(
  reducers,
  applyMiddleware(
    thunkMiddleware,
    promiseMiddleware,
    loggerMiddleware
  )
);

export const persistor = persistStore(store);
