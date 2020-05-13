// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import { Action } from 'redux-actions';

import Container from './widgets/Container';
import ExternalLink from './widgets/ExternalLink';
import SyncGate from './SyncGate';
import LoginForm from './components/LoginForm';
import EncryptionLoginForm from './components/EncryptionLoginForm';

import { store, StoreState, CredentialsDataRemote } from './store';
import { deriveKey, fetchCredentials, fetchUserInfo, logout } from './store/actions';

import * as EteSync from 'etesync';
import * as C from './constants';

import SignedPagesBadge from './images/signed-pages-badge.svg';
import LoadingIndicator from './widgets/LoadingIndicator';
import { useCredentials, useRemoteCredentials } from './login';
import { useSelector } from 'react-redux';


function EncryptionPart(props: { credentials: CredentialsDataRemote }) {
  const [fetched, setFetched] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState<EteSync.UserInfo>();
  const [error, setError] = React.useState<Error>();

  const credentials = props.credentials;

  React.useEffect(() => {
    store.dispatch<any>(fetchUserInfo(credentials, credentials.credentials.email)).then((fetchedUserInfo: Action<EteSync.UserInfo>) => {
      setUserInfo(fetchedUserInfo.payload);
    }).catch((e: Error) => {
      // Do nothing.
      if (e instanceof EteSync.HTTPError) {
        if (e.status === 404) {
          // Do nothing
        } else if (e.status === 401) {
          store.dispatch(logout(credentials));
        } else {
          setError(e);
        }
      }
    }).finally(() => {
      setFetched(true);
    });
  }, [credentials]);

  if (!fetched) {
    return <LoadingIndicator />;
  }

  function onEncryptionFormSubmit(encryptionPassword: string) {
    const derivedAction = deriveKey(credentials.credentials.email, encryptionPassword);
    if (userInfo) {
      const userInfoCryptoManager = userInfo.getCryptoManager(derivedAction.payload!);
      try {
        userInfo.verify(userInfoCryptoManager);
      } catch (e) {
        setError(new EteSync.EncryptionPasswordError('Wrong encryption password'));
        return;
      }
    }
    store.dispatch(derivedAction);
  }

  const isNewUser = !userInfo;

  return (
    <Container style={{ maxWidth: '30rem' }}>
      <h2>Encryption Password</h2>
      {(isNewUser) ?
        <div>
          <h3>Welcome to EteSync!</h3>
          <p>
            Please set your encryption password below, and make sure you got it right, as it <em>can't</em> be recovered if lost!
          </p>
        </div>
        :
        <p>
          You are logged in as <strong>{credentials.credentials.email}</strong>.
          Please enter your encryption password to continue, or log out from the side menu.
        </p>
      }

      <EncryptionLoginForm
        error={error}
        onSubmit={onEncryptionFormSubmit}
      />
    </Container>
  );
}

export default function LoginGate() {
  const remoteCredentials = useRemoteCredentials();
  const credentials = useCredentials();
  const fetchCount = useSelector((state: StoreState) => state.fetchCount);
  const [fetchError, setFetchError] = React.useState<Error>();

  async function onFormSubmit(username: string, password: string, serviceApiUrl?: string) {
    serviceApiUrl = serviceApiUrl ? serviceApiUrl : C.serviceApiBase;
    try {
      setFetchError(undefined);
      const ret = fetchCredentials(username, password, serviceApiUrl);
      await ret.payload;
      store.dispatch(ret);
    } catch (e) {
      setFetchError(e);
    }
  }

  if (remoteCredentials === null) {
    const style = {
      isSafe: {
        textDecoration: 'none',
        display: 'block',
      },
      divider: {
        margin: '30px 0',
        color: '#00000025',
      },
    };

    return (
      <Container style={{ maxWidth: '30rem' }}>
        <h2>Please Log In</h2>
        <LoginForm
          onSubmit={onFormSubmit}
          error={fetchError}
          loading={fetchCount > 0}
        />
        <hr style={style.divider} />
        <ExternalLink style={style.isSafe} href="https://www.etesync.com/faq/#signed-pages">
          <img alt="SignedPgaes badge" src={SignedPagesBadge} />
        </ExternalLink>
        <ul>
          <li><ExternalLink style={style.isSafe} href={C.homePage}>
            The EteSync Website
          </ExternalLink></li>
          <li><ExternalLink style={style.isSafe} href={C.faq + '#web-client'}>
            Is the web client safe to use?
          </ExternalLink></li>
          <li><ExternalLink style={style.isSafe} href={C.sourceCode}>Source code</ExternalLink></li>
        </ul>
      </Container>
    );
  } else if (credentials === null) {
    return (
      <EncryptionPart credentials={remoteCredentials} />
    );
  }

  return (
    <SyncGate etesync={credentials} />
  );
}
