// SPDX-FileCopyrightText: © 2017 Etebase Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { useSelector } from "react-redux";
import { createSelector } from "reselect";

import * as Etebase from "etebase";

import * as store from "./store";
import { usePromiseMemo } from "./helpers";

export const credentialsSelector = createSelector(
  (state: store.StoreState) => state.credentials.storedSession,
  (storedSession) => {
    if (storedSession) {
      return Etebase.Account.restore(storedSession);
    } else {
      return Promise.resolve(null);
    }
  }
);

export function useCredentials() {
  const credentialsPromise = useSelector(credentialsSelector);
  return usePromiseMemo(credentialsPromise, [credentialsPromise]);
}
