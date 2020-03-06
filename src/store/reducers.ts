// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { Action, ActionMeta, ActionFunctionAny, combineActions, handleAction, handleActions } from 'redux-actions';
import { shallowEqual } from 'react-redux';

import { List, Map as ImmutableMap } from 'immutable';

import * as EteSync from 'etesync';

import * as actions from './actions';

export interface CredentialsDataRemote {
  serviceApiUrl: string;
  credentials: EteSync.Credentials;
}

export interface CredentialsData extends CredentialsDataRemote {
  encryptionKey: string;
}

export type JournalsData = ImmutableMap<string, EteSync.Journal>;

export type EntriesListData = List<EteSync.Entry>;
export type EntriesData = ImmutableMap<string, EntriesListData>;

export type UserInfoData = EteSync.UserInfo;

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

function entriesListSetExtend(
  state: List<any> | undefined, action: Action<EteSync.Entry[]>, extend = false) {
  state = state ?? List([]);

  if (action.error) {
    return state;
  } else {
    const payload = action.payload ?? null;

    if (!payload) {
      return state;
    }

    if (extend && (state !== null)) {
      if (payload !== null) {
        state = state.concat(payload);
      }
    } else if (payload !== null) {
      state = List(payload);
    }
    return state;
  }
}

function fetchCreateEntriesReducer(state: EntriesData, action: any) {
  const prevState = state.get(action.meta.journal);
  const extend = action.meta.prevUid !== null;
  return state.set(action.meta.journal,
    entriesListSetExtend(prevState, action, extend));
}

export const entries = handleActions(
  {
    [actions.fetchEntries.toString()]: fetchCreateEntriesReducer,
    [actions.addEntries.toString()]: fetchCreateEntriesReducer,
    [actions.addJournal.toString()]: (state: EntriesData, action: any) => {
      const journal = action.meta.item.uid;
      return state.set(journal, List([]));
    },
    [actions.logout.toString()]: (state: EntriesData, _action: any) => {
      return state.clear();
    },
  },
  ImmutableMap({})
);

const setMapModelReducer = (state: JournalsData, action: Action<EteSync.Journal[]>) => {
  if (action.error || !action.payload) {
    return state;
  }

  state = state ?? ImmutableMap<string, EteSync.Journal>().asMutable();
  const old = state.asMutable();

  return state.withMutations((ret) => {
    const items = action.payload!;
    for (const item of items) {
      const current = old.get(item.uid);
      if (!current || !shallowEqual(current.serialize(), item.serialize())) {
        ret.set(item.uid, item);
      }

      if (current) {
        old.delete(item.uid);
      }
    }

    // Delete all the items that were deleted remotely (not handled above).
    for (const uid of old.keys()) {
      ret.delete(uid);
    }
  });
};

const addEditMapModelReducer = (state: JournalsData, action: ActionMeta<EteSync.Journal, { item: EteSync.Journal }>) => {
  if (action.error) {
    return state;
  } else {
    let payload = (action.payload === undefined) ? null : action.payload;
    payload = (action.meta === undefined) ? payload : action.meta.item;

    if (!payload) {
      return state;
    }

    const item = payload;
    return state.set(item.uid, item);
  }
};

const deleteMapModelReducer = (state: JournalsData, action: ActionMeta<EteSync.Journal, { item: EteSync.Journal }>) => {
  if (action.error) {
    return state;
  } else {
    let payload = (action.payload === undefined) ? null : action.payload;
    payload = (action.meta === undefined) ? payload : action.meta.item;

    if (!payload) {
      return state;
    }

    const uid = payload.uid;
    return state.delete(uid);
  }
};

export const journals = handleActions(
  {
    [actions.fetchListJournal.toString()]: setMapModelReducer as any,
    [actions.addJournal.toString()]: addEditMapModelReducer,
    [actions.updateJournal.toString()]: addEditMapModelReducer,
    [actions.deleteJournal.toString()]: deleteMapModelReducer,
    [actions.logout.toString()]: (state: JournalsData, _action: any) => {
      return state.clear();
    },
  },
  ImmutableMap({})
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
    [combineActions(
      actions.fetchListJournal,
      actions.addJournal,
      actions.updateJournal,
      actions.deleteJournal,
      actions.fetchEntries,
      actions.addEntries
    ).toString()]: (state: List<Error>, action: Action<any>) => {
      if (action.error) {
        return state.push(action.payload);
      }

      return state;
    },
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
