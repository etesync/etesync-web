import * as React from 'react';

import { Action } from 'redux-actions';

import Container from './widgets/Container';
import ExternalLink from './widgets/ExternalLink';
import SyncGate from './SyncGate';
import LoginForm from './components/LoginForm';
import EncryptionLoginForm from './components/EncryptionLoginForm';

import { store, CredentialsType } from './store';
import { deriveKey, fetchCredentials, fetchUserInfo } from './store/actions';

import * as EteSync from 'etesync';
import * as C from './constants';

import SignedPagesBadge from './images/signed-pages-badge.svg';
import LoadingIndicator from './widgets/LoadingIndicator';


function EncryptionPart(props: { credentials: CredentialsType }) {
  const [fetched, setFetched] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState<EteSync.UserInfo>();
  const [error, setError] = React.useState<Error>();

  const credentials = props.credentials.value!;

  React.useEffect(() => {
    // FIXME: verify the error is a 404
    store.dispatch<any>(fetchUserInfo(credentials, credentials.credentials.email)).then((fetchedUserInfo: Action<EteSync.UserInfo>) => {
      setUserInfo(fetchedUserInfo.payload);
    }).catch(() => {
      // Do nothing.
    }).finally(() => {
      setFetched(true);
    });
  }, [credentials]);

  if (!fetched) {
    return <LoadingIndicator />;
  }

  function onEncryptionFormSubmit(encryptionPassword: string) {
    const derivedAction = deriveKey(props.credentials.value!.credentials.email, encryptionPassword);
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

interface PropsType {
  credentials: CredentialsType;
}

export default function LoginGate(props: PropsType) {

  function onFormSubmit(username: string, password: string, serviceApiUrl?: string) {
    serviceApiUrl = serviceApiUrl ? serviceApiUrl : C.serviceApiBase;
    store.dispatch<any>(fetchCredentials(username, password, serviceApiUrl));
  }

  if (props.credentials.value === null) {
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
          error={props.credentials.error}
          loading={props.credentials.fetching}
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
  } else if (props.credentials.value.encryptionKey === null) {
    return (
      <EncryptionPart credentials={props.credentials} />
    );
  }

  return (
    <SyncGate etesync={props.credentials.value} />
  );
}
