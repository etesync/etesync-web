// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import * as Etebase from "etebase";
import { Redirect, useLocation } from "react-router";
import Button from "@material-ui/core/Button";
import Alert from "@material-ui/lab/Alert";

import { routeResolver } from "./App";

import Container from "./widgets/Container";
import LoadingIndicator from "./widgets/LoadingIndicator";
import Wizard, { WizardNavigationBar, PagePropsType } from "./widgets/Wizard";

import { SyncManager } from "./sync/SyncManager";

import { store } from "./store";
import { useCredentials } from "./credentials";

import wizardWelcome from "./images/wizard-welcome.svg";
import wizardCreate from "./images/wizard-create.svg";

interface LocationState {
  from: {
    pathname: string;
  };
}

const wizardPages = [
  (props: PagePropsType) => (
    <>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center" }}>
        <h2 style={{ textAlign: "center" }}>Welcome to EteSync!</h2>
        <p style={{ textAlign: "center" }}>
          Please follow these few quick steps to help you get started.
        </p>
        <img src={wizardWelcome} style={{ maxWidth: "30em", marginTop: "2em" }} />
      </div>
      <WizardNavigationBar {...props} />
    </>
  ),
  (props: PagePropsType) => (
    <SetupCollectionsPage {...props} />
  ),
];

function SetupCollectionsPage(props: PagePropsType) {
  const etebase = useCredentials()!;
  const [error, setError] = React.useState<Error>();
  const [loading, setLoading] = React.useState(false);
  async function onNext() {
    setLoading(true);
    try {
      const colMgr = etebase.getCollectionManager();
      const types = [
        ["etebase.vcard", "My Contacts"],
        ["etebase.vevent", "My Calendar"],
        ["etebase.vtodo", "My Tasks"],
      ];
      for (const [type, name] of types) {
        const meta: Etebase.CollectionMetadata = {
          type,
          name,
        };
        const collection = await colMgr.create(meta, "");
        await colMgr.upload(collection);
      }

      props.next?.();
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  const next = (loading) ? undefined : onNext;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center" }}>
        <h2 style={{ textAlign: "center" }}>Setup Collections</h2>
        <p style={{ textAlign: "center", maxWidth: "50em" }}>
          In order to start using EteSync you need to create collections to store your data. Clicking <i>Finish</i> below will create a default calendar, address book and a task list for you.
        </p>
        {(loading) ? (
          <LoadingIndicator style={{ display: "block", margin: "40px auto" }} />
        ) : (error) ? (
          <Alert severity="error">{error.message}</Alert>
        ) : (
          <img src={wizardCreate} style={{ maxWidth: "30em", marginTop: "2em" }} />
        )}
      </div>
      <WizardNavigationBar {...props} next={next} />
    </>
  );
}

export default function WizardPage() {
  const [tryCount, setTryCount] = React.useState(0);
  const [ranWizard, setRanWizard] = React.useState(false);
  const [syncError, setSyncError] = React.useState<Error>();
  const etebase = useCredentials();
  const location = useLocation();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    setSyncError(undefined);
    (async () => {
      const syncManager = SyncManager.getManager(etebase!);
      const sync = syncManager.sync(true);
      try {
        await sync;

        const cachedCollection = store.getState().cache.collections;
        // XXX new account - though should change test to see if there are any PIM types
        if (cachedCollection.size > 0) {
          setRanWizard(true);
        }
      } catch (e) {
        setSyncError(e);
      }
      setLoading(false);
    })();
  }, [tryCount]);

  if (syncError) {
    return (
      <Container>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center" }}>
          <h2 style={{ textAlign: "center" }}>Error!</h2>
          <p style={{ textAlign: "center" }}>
            {syncError?.message}
          </p>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setTryCount(tryCount + 1)}
          >
            Retry
          </Button>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (<LoadingIndicator style={{ display: "block", margin: "40px auto" }} />);
  }

  if (!ranWizard) {
    return (
      <Wizard pages={wizardPages} onFinish={() => setRanWizard(true)} style={{ display: "flex", flexDirection: "column", flex: 1 }} />
    );
  }

  const { from } = location.state as LocationState || { from: { pathname: routeResolver.getRoute("home") } };
  return (
    <Redirect to={from.pathname} />
  );
}
