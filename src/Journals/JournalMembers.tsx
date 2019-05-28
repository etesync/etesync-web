import * as React from 'react';

import { List, ListItem } from '../widgets/List';

import { Theme, withTheme } from '@material-ui/core/styles';

import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';
import LoadingIndicator from '../widgets/LoadingIndicator';
import ConfirmationDialog from '../widgets/ConfirmationDialog';

import * as EteSync from '../api/EteSync';
import { CredentialsData } from '../store';

interface PropsType {
  etesync: CredentialsData;
  info: EteSync.CollectionInfo;
}

interface PropsTypeInner extends PropsType {
  theme: Theme;
}

class JournalMembers extends React.PureComponent<PropsTypeInner> {
  public state = {
    members: null as EteSync.JournalMemberJson[] | null,
    revokeUser: null as string | null,
  };

  constructor(props: PropsTypeInner) {
    super(props);

    this.onRevokeRequest = this.onRevokeRequest.bind(this);
    this.onRevokeDo = this.onRevokeDo.bind(this);
  }

  public render() {
    const { info } = this.props;
    const { members, revokeUser } = this.state;

    return (
      <>
        <AppBarOverride title={`${info.displayName} - Members`} />
        <Container style={{maxWidth: '30rem'}}>
          { members ?
              (members.length > 0 ?
                <List>
                  { members.map((member) => (
                    <ListItem key={member.user} onClick={() => this.onRevokeRequest(member.user)}>
                      {member.user}
                    </ListItem>
                  ))}
              </List>
              :
              <div>No members</div>
              )
            :
            <LoadingIndicator />
          }
        </Container>
        <ConfirmationDialog
          title="Remove member"
          labelOk="OK"
          open={revokeUser !== null}
          onOk={this.onRevokeDo}
          onCancel={() => this.setState({revokeUser: null})}
        >
          Would you like to revoke {revokeUser}'s access?<br />
          Please be advised that a malicious user would potentially be able to retain access to encryption keys. Please refer to the FAQ for more information.
        </ConfirmationDialog>
      </>
    );
  }

  public componentDidMount() {
    this.fetchMembers();
  }

  private fetchMembers() {
    const { etesync, info } = this.props;

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
    const { etesync, info } = this.props;
    const { revokeUser } = this.state;

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
}

export default withTheme()(JournalMembers);
