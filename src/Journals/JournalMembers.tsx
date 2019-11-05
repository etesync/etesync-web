import * as React from 'react';
import * as sjcl from 'sjcl';

import { List, ListItem } from '../widgets/List';

import { Theme, withTheme } from '@material-ui/core/styles';
import IconMemberAdd from '@material-ui/icons/PersonAdd';

import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';
import LoadingIndicator from '../widgets/LoadingIndicator';
import ConfirmationDialog from '../widgets/ConfirmationDialog';

import JournalMemberAddDialog from './JournalMemberAddDialog';

import * as EteSync from '../api/EteSync';
import { CredentialsData, UserInfoData } from '../store';

import { SyncInfoJournal } from '../SyncGate';

interface PropsType {
  etesync: CredentialsData;
  syncJournal: SyncInfoJournal;
  userInfo: UserInfoData;
}

interface PropsTypeInner extends PropsType {
  theme: Theme;
}

class JournalMembers extends React.PureComponent<PropsTypeInner> {
  public state = {
    members: null as EteSync.JournalMemberJson[] | null,
    revokeUser: null as string | null,
    addMemberOpen: false,
  };

  constructor(props: PropsTypeInner) {
    super(props);

    this.onRevokeRequest = this.onRevokeRequest.bind(this);
    this.onRevokeDo = this.onRevokeDo.bind(this);
    this.onMemberAdd = this.onMemberAdd.bind(this);
  }

  public render() {
    const { syncJournal } = this.props;
    const { members, revokeUser, addMemberOpen } = this.state;

    const info = syncJournal.collection;
    const sharingAllowed = syncJournal.journal.version > 1;

    return (
      <>
        <AppBarOverride title={`${info.displayName} - Members`} />
        <Container style={{ maxWidth: '30rem' }}>
          { members ?
            <List>
              <ListItem rightIcon={<IconMemberAdd />} onClick={() => this.setState({ addMemberOpen: true })}>
                  Add member
              </ListItem>
              {(members.length > 0 ?
                members.map((member) => (
                  <ListItem key={member.user} onClick={() => this.onRevokeRequest(member.user)}>
                    {member.user}
                  </ListItem>
                ))
                :
                <ListItem>
                    No members
                </ListItem>
              )}
            </List>
            :
            <LoadingIndicator />
          }
        </Container>
        <ConfirmationDialog
          title="Remove member"
          labelOk="OK"
          open={revokeUser !== null}
          onOk={this.onRevokeDo}
          onCancel={() => this.setState({ revokeUser: null })}
        >
          Would you like to revoke {revokeUser}'s access?<br />
          Please be advised that a malicious user would potentially be able to retain access to encryption keys. Please refer to the FAQ for more information.
        </ConfirmationDialog>

        { addMemberOpen &&
          (sharingAllowed ?
            <JournalMemberAddDialog
              etesync={this.props.etesync}
              info={info}
              onOk={this.onMemberAdd}
              onClose={() => this.setState({ addMemberOpen: false })}
            />
            :
            <ConfirmationDialog
              title="Now Allowed"
              labelOk="OK"
              open
              onOk={() => this.setState({ addMemberOpen: false })}
              onClose={() => this.setState({ addMemberOpen: false })}
            >
              Sharing of old-style journals is not allowed. In order to share this journal, create a new one, and copy its contents over using the "import" dialog. If you are experiencing any issues, please contact support.
            </ConfirmationDialog>
          )
        }
      </>
    );
  }

  public componentDidMount() {
    this.fetchMembers();
  }

  private fetchMembers() {
    const { etesync, syncJournal } = this.props;
    const info = syncJournal.collection;

    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalMembersManager = new EteSync.JournalMembersManager(creds, apiBase, info.uid);
    journalMembersManager.list().then((members) => {
      this.setState({
        members,
      });
    });
  }

  private onRevokeRequest(user: string) {
    this.setState({
      revokeUser: user,
    });
  }

  private onRevokeDo() {
    const { etesync, syncJournal } = this.props;
    const { revokeUser } = this.state;
    const info = syncJournal.collection;

    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalMembersManager = new EteSync.JournalMembersManager(creds, apiBase, info.uid);
    journalMembersManager.delete({ user: revokeUser!, key: '' }).then(() => {
      this.fetchMembers();
    });
    this.setState({
      revokeUser: null,
    });
  }

  private onMemberAdd(user: string, publicKey: string) {
    const { etesync, syncJournal, userInfo } = this.props;
    const journal = syncJournal.journal;
    const derived = this.props.etesync.encryptionKey;

    const keyPair = userInfo.getKeyPair(userInfo.getCryptoManager(derived));
    const cryptoManager = journal.getCryptoManager(derived, keyPair);

    const pubkeyBytes = sjcl.codec.bytes.fromBits(sjcl.codec.base64.toBits(publicKey));
    const encryptedKey = sjcl.codec.base64.fromBits(sjcl.codec.bytes.toBits(cryptoManager.getEncryptedKey(keyPair, pubkeyBytes)));

    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalMembersManager = new EteSync.JournalMembersManager(creds, apiBase, journal.uid);
    journalMembersManager.create({ user, key: encryptedKey }).then(() => {
      this.fetchMembers();
    });
    this.setState({
      addMemberOpen: false,
    });
  }
}

export default withTheme()(JournalMembers);
