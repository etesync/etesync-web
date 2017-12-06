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

function journalsSuccess(value: JournalsData) {
  return {
    type: Actions.FETCH_JOURNALS,
    status: FetchStatus.Success,
    journals: value,
  };
}

function journalsRequest() {
  return {
    type: Actions.FETCH_JOURNALS,
    status: FetchStatus.Request,
  };
}

function journalsFailure(error: Error) {
  return {
    type: Actions.FETCH_JOURNALS,
    status: FetchStatus.Failure,
    error,
  };
}

export function fetchJournals(etesync: CredentialsData) {
  const creds = etesync.credentials;
  const apiBase = etesync.serviceApiUrl;

  return (dispatch: any) => {
    dispatch(journalsRequest());

    let journalManager = new EteSync.JournalManager(creds, apiBase);
    journalManager.list().then(
      (vals) => {
        dispatch(journalsSuccess(vals));
      },
      (error) => {
        dispatch(journalsFailure(error));
      }
    );
  };
}

function entriesSuccess(journal: string, value: EntriesData) {
  return {
    type: Actions.FETCH_ENTRIES,
    status: FetchStatus.Success,
    entries: value,
    journal,
  };
}

function entriesRequest(journal: string) {
  return {
    type: Actions.FETCH_ENTRIES,
    status: FetchStatus.Request,
    journal,
  };
}

function entriesFailure(journal: string, error: Error) {
  return {
    type: Actions.FETCH_ENTRIES,
    status: FetchStatus.Failure,
    journal,
    error,
  };
}

export function fetchEntries(etesync: CredentialsData, journalUid: string) {
  const creds = etesync.credentials;
  const apiBase = etesync.serviceApiUrl;

  return (dispatch: any) => {
    const prevUid = null;
    dispatch(entriesRequest(journalUid));

    let entryManager = new EteSync.EntryManager(creds, apiBase, journalUid);
    entryManager.list(prevUid).then(
      (vals) => {
        dispatch(entriesSuccess(journalUid, vals));
      },
      (error) => {
        dispatch(entriesFailure(journalUid, error));
      }
    );
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

function entries(state: EntriesType = {}, action: any) {
  switch (action.type) {
    case Actions.FETCH_ENTRIES:
      switch (action.status) {
        case FetchStatus.Success:
          return { ...state,
            [action.journal]: {
              status: action.status,
              value: action.entries,
            },
          };
        case FetchStatus.Failure:
          return { ...state,
            [action.journal]: {
              status: action.status,
              value: null,
              error: action.error,
            },
          };
        default:
          return { ...state,
            [action.journal]: {
              status: action.status,
              value: null,
            },
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
    journals,
    entries,
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
