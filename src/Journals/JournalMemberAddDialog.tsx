import * as React from 'react';

import TextField from '@material-ui/core/TextField';

import LoadingIndicator from '../widgets/LoadingIndicator';
import ConfirmationDialog from '../widgets/ConfirmationDialog';
import PrettyFingerprint from '../widgets/PrettyFingerprint';

import * as EteSync from '../api/EteSync';
import { CredentialsData } from '../store';

import { handleInputChange } from '../helpers';

interface PropsType {
  etesync: CredentialsData;
  info: EteSync.CollectionInfo;
  onOk: (user: string, publicKey: string) => void;
  onClose: () => void;
}

class JournalMemberAddDialog extends React.PureComponent<PropsType> {
  public state = {
    addUser: '',
    publicKey: '',
    userChosen: false,
    error: undefined as Error | undefined,
  };

  private handleInputChange: any;

  constructor(props: PropsType) {
    super(props);

    this.handleInputChange = handleInputChange(this);
    this.onAddRequest = this.onAddRequest.bind(this);
    this.onOk = this.onOk.bind(this);
  }

  public render() {
    const { onClose } = this.props;
    const { addUser, userChosen, publicKey, error } = this.state;

    if (error) {
      return (
        <>
          <ConfirmationDialog
            title="Error adding member"
            labelOk="OK"
            open
            onOk={onClose}
            onCancel={onClose}
          >
            User ({addUser}) not found, or has journal sharing disabled.
          </ConfirmationDialog>
        </>
      );
    }

    if (publicKey) {
      return (
        <>
          <ConfirmationDialog
            title="Verify security fingerprint"
            labelOk="OK"
            open
            onOk={this.onOk}
            onCancel={onClose}
          >
            <p>
              Verify {addUser}'s security fingerprint to ensure the encryption is secure.
            </p>
            <div style={{ textAlign: 'center' }}>
              <PrettyFingerprint publicKey={publicKey} />
            </div>
          </ConfirmationDialog>
        </>
      );
    } else {
      return (
        <>
          <ConfirmationDialog
            title="Add member"
            labelOk="OK"
            open={!userChosen}
            onOk={this.onAddRequest}
            onCancel={onClose}
          >
            { userChosen ?
              <LoadingIndicator />
              :
              <TextField
                name="addUser"
                type="email"
                placeholder="User email"
                style={{ width: '100%' }}
                value={addUser}
                onChange={this.handleInputChange}
              />
            }
          </ConfirmationDialog>
        </>
      );
    }
  }

  private onAddRequest(user: string) {
    this.setState({
      userChosen: true,
    });

    const { etesync } = this.props;
    const { addUser } = this.state;

    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const userInfoManager = new EteSync.UserInfoManager(creds, apiBase);
    userInfoManager.fetch(addUser).then((userInfo) => {
      this.setState({
        publicKey: userInfo.publicKey,
      });
    }).catch((error) => {
      this.setState({error});
    });
  }

  private onOk() {
    const { addUser, publicKey } = this.state;
    this.props.onOk(addUser, publicKey);
  }
}

export default JournalMemberAddDialog;
