import { Action, ActionFunctionAny, combineActions, handleAction, handleActions } from 'redux-actions';
import { shallowEqual } from 'react-redux';

import { List, Map as ImmutableMap, Record } from 'immutable';

import * as EteSync from 'etesync';

import * as actions from './actions';

interface FetchTypeInterface<T> {
  value: T | null;
  fetching?: boolean;
  error?: Error;
}

export interface CredentialsDataRemote {
  serviceApiUrl: string;
  credentials: EteSync.Credentials;
}

export interface CredentialsData extends CredentialsDataRemote {
  encryptionKey: string;
}

export type FetchType<T> = FetchTypeInterface<T>;

function fetchTypeRecord<T>() {
  return Record<FetchTypeInterface<T>>({
    value: null as T | null,
    error: undefined,
  });
}

interface BaseModel {
  uid: string;
}

export type JournalsData = ImmutableMap<string, EteSync.Journal>;
export const JournalsFetchRecord = fetchTypeRecord<JournalsData>();
export type JournalsType = FetchType<JournalsData>;
export type JournalsTypeImmutable = Record<JournalsType>;

export type EntriesData = List<EteSync.Entry>;
export const EntriesFetchRecord = fetchTypeRecord<EntriesData>();
export type EntriesTypeImmutable = ImmutableMap<string, Record<FetchType<EntriesData>>>;
export type EntriesType = ImmutableMap<string, FetchType<EntriesData>>;

export type UserInfoData = EteSync.UserInfo;

function fetchTypeIdentityReducer(
  state: Record<FetchType<any>> = fetchTypeRecord<any>()(), action: any, extend = false) {
  if (action.error) {
    return state.set('error', action.payload);
  } else {
    const payload = (action.payload === undefined) ? null : action.payload;

    state = state.set('error', undefined);

    if (action.payload === undefined) {
      return state;
    }

    let value = state.get('value', null);
    if (extend && (value !== null)) {
      if (payload !== null) {
        value = value.concat(payload);
      }
    } else if (payload !== null) {
      value = List(payload);
    } else {
      value = null;
    }
    return state.set('value', value);
  }
}

export const encryptionKeyReducer = handleActions(
  {
    [actions.deriveKey.toString()]: (_state: {key: string | null}, action: any) => (
      { key: action.payload }
    ),
    [actions.resetKey.toString()]: (_state: {key: string | null}, _action: any) => (
      { key: null }
    ),
    [actions.logout.toString()]: (_state: {key: string | null}, _action: any) => {
      return { out: true, key: null };
    },
  },
  { key: null }
);

export const credentials = handleActions(
  {
    [actions.fetchCredentials.toString()]: (
      state: CredentialsDataRemote, action: any) => {
      if (action.error) {
        return state;
      } else if (action.payload === undefined) {
        return state;
      } else {
        const {
          encryptionKey, // We don't want to set encryption key here.
          ...payload
        } = action.payload;
        return payload;
      }
    },
    [actions.logout.toString()]: (_state: CredentialsDataRemote, _action: any) => {
      return {};
    },
  },
  {} as CredentialsDataRemote
);

const setMapModelReducer = <T extends Record<any>, V extends BaseModel>(state: T, action: any) => {
  const newState = fetchTypeIdentityReducer(state, action);
  // Compare the states and see if they are really different
  const newItems = newState.get('value', null);

  if (!newItems) {
    return newState;
  }

  const ret = new Map<string, V>();

  newItems.forEach((item: V) => {
    ret.set(item.uid, item);
  });

  return newState.set('value', ImmutableMap(ret));
};

const addEditMapModelReducer = <T extends Record<any>, V extends BaseModel>(state: T, action: any) => {
  if (action.error) {
    return state.set('error', action.payload);
  } else {
    let payload = (action.payload === undefined) ? null : action.payload;
    payload = (action.meta === undefined) ? payload : action.meta.item;

    state = state.set('error', undefined);

    if (action.payload === undefined) {
      return state;
    }

    const item = payload as V;
    let value = state.get('value', null)!;
    value = value.set(item.uid, item);
    return state.set('value', value);
  }
};

const deleteMapModelReducer = <T extends Record<any>>(state: T, action: any) => {
  if (action.error) {
    return state.set('error', action.payload);
  } else {
    let payload = (action.payload === undefined) ? null : action.payload;
    payload = (action.meta === undefined) ? payload : action.meta.item;

    state = state.set('error', undefined);

    if (action.payload === undefined) {
      return state;
    }

    const uid = payload.uid;
    let value = state.get('value', null)!;
    value = value.delete(uid);
    return state.set('value', value);
  }
};

const mapReducerActionsMapCreator = <T extends Record<any>, V extends BaseModel>(actionName: string) => {
  const setsReducer = (state: T, action: any) => setMapModelReducer<T, V>(state, action);
  const addEditReducer = (state: T, action: any) => addEditMapModelReducer<T, V>(state, action);
  const deleteReducer = (state: T, action: any) => deleteMapModelReducer<T>(state, action);

  return {
    [actions['fetchList' + actionName].toString() as string]: setsReducer,
    [actions['add' + actionName].toString() as string]: addEditReducer,
    [actions['update' + actionName].toString() as string]: addEditReducer,
    [actions['delete' + actionName].toString() as string]: deleteReducer,
  };
};

function fetchCreateEntriesReducer(state: EntriesTypeImmutable, action: any) {
  const prevState = state.get(action.meta.journal);
  const extend = action.meta.prevUid != null;
  return state.set(action.meta.journal,
    fetchTypeIdentityReducer(prevState, action, extend));
}

export const entries = handleActions(
  {
    [actions.fetchEntries.toString()]: fetchCreateEntriesReducer,
    [actions.addEntries.toString()]: fetchCreateEntriesReducer,
    [actions.addJournal.toString()]: (state: EntriesTypeImmutable, action: any) => {
      const journal = action.meta.item.uid;
      const prevState = state.get(journal);
      return state.set(journal,
        fetchTypeIdentityReducer(prevState, { payload: [] }, false));
    },
  },
  ImmutableMap({})
);

export const journals = handleActions(
  {
    ...mapReducerActionsMapCreator<JournalsTypeImmutable, EteSync.Journal>('Journal'),
  },
  new JournalsFetchRecord()
);

export const userInfo = handleActions(
  {
    [combineActions(
      actions.fetchUserInfo,
      actions.createUserInfo
    ).toString()]: (state: UserInfoData | null, action: any) => {
      if (action.error) {
        return state;
      } else {
        let payload = action.payload ?? null;

        if (payload === null) {
          return state;
        }

        payload = action.meta?.userInfo ?? payload;

        if (!state || !shallowEqual(state.serialize(), payload.serialize())) {
          return payload;
        }

        return state;
      }
    },
    [actions.logout.toString()]: (_state: any, _action: any) => {
      return null;
    },
  },
  null
);

const fetchActions = [
] as Array<ActionFunctionAny<Action<any>>>;

for (const func in actions) {
  if (func.startsWith('fetch') ||
    func.startsWith('add') ||
    func.startsWith('update') ||
    func.startsWith('delete')) {

    fetchActions.push(actions[func]);
  }
}

// Indicates network activity, not just fetch
export const fetchCount = handleAction(
  combineActions(
    ...fetchActions
  ),
  (state: number, action: any) => {
    if (action.payload === undefined) {
      return state + 1;
    } else {
      return state - 1;
    }
  },
  0
);

export const errorsReducer = handleActions(
  {
    [actions.addError.toString()]: (state: List<Error>, action: Action<any>) => {
      return state.push(action.payload);
    },
    [actions.clearErros.toString()]: (state: List<Error>, _action: Action<any>) => {
      return state.clear();
    },
  },
  List([])
);


// FIXME Move all the below (potentially the fetchCount ones too) to their own file
export interface SettingsType {
  locale: string;
}

export const settingsReducer = handleActions(
  {
    [actions.setSettings.toString()]: (_state: {key: string | null}, action: any) => (
      { ...action.payload }
    ),
  },
  { locale: 'en-gb' }
);
