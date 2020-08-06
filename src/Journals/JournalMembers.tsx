// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import sjcl from "sjcl";

import { List, ListItem } from "../widgets/List";

import IconMemberAdd from "@material-ui/icons/PersonAdd";
import VisibilityIcon from "@material-ui/icons/Visibility";

import AppBarOverride from "../widgets/AppBarOverride";
import Container from "../widgets/Container";
import LoadingIndicator from "../widgets/LoadingIndicator";
import ConfirmationDialog from "../widgets/ConfirmationDialog";

import JournalMemberAddDialog from "./JournalMemberAddDialog";

import * as EteSync from "etesync";
import { CredentialsData, UserInfoData } from "../store";

import { SyncInfoJournal } from "../SyncGate";

interface PropsType {
  etesync: CredentialsData;
  syncJournal: SyncInfoJournal;
  userInfo: UserInfoData;
}

export default function JournalMembers(props: PropsType) {
  const [members, setMembers] = React.useState<EteSync.JournalMemberJson[] | null>(null);
  const [revokeUser, setRevokeUser] = React.useState<string | null>(null);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);

  function fetchMembers() {
    const { etesync, syncJournal } = props;
    const info = syncJournal.collection;

    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalMembersManager = new EteSync.JournalMembersManager(creds, apiBase, info.uid);
    journalMembersManager.list().then((members) => {
      setMembers(members);
    });
  }

  React.useEffect(() => {
    fetchMembers();
  }, []);

  function onRevokeRequest(user: string) {
    setRevokeUser(user);
  }

  function onRevokeDo() {
    const { etesync, syncJournal } = props;
    const info = syncJournal.collection;

    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalMembersManager = new EteSync.JournalMembersManager(creds, apiBase, info.uid);
    journalMembersManager.delete({ user: revokeUser!, key: "" }).then(() => {
      fetchMembers();
    });
    setRevokeUser(null);
  }

  function onMemberAdd(user: string, publicKey: string, readOnly: boolean) {
    const { etesync, syncJournal, userInfo } = props;
    const journal = syncJournal.journal;
    const derived = props.etesync.encryptionKey;

    const keyPair = userInfo.getKeyPair(userInfo.getCryptoManager(derived));
    const cryptoManager = journal.getCryptoManager(derived, keyPair);

    const pubkeyBytes = sjcl.codec.bytes.fromBits(sjcl.codec.base64.toBits(publicKey));
    const encryptedKey = sjcl.codec.base64.fromBits(sjcl.codec.bytes.toBits(cryptoManager.getEncryptedKey(keyPair, pubkeyBytes)));

    const creds = etesync.credentials;
    const apiBase = etesync.serviceApiUrl;
    const journalMembersManager = new EteSync.JournalMembersManager(creds, apiBase, journal.uid);
    journalMembersManager.create({ user, key: encryptedKey, readOnly }).then(() => {
      fetchMembers();
    });
    setAddMemberOpen(false);
  }

  const { syncJournal } = props;

  const info = syncJournal.collection;
  const sharingAllowed = syncJournal.journal.version > 1;

  return (
    <>
      <AppBarOverride title={`${info.displayName} - Members`} />
      <Container style={{ maxWidth: "30rem" }}>
        {members ?
          <List>
            <ListItem rightIcon={<IconMemberAdd />} onClick={() => setAddMemberOpen(true)}>
              Add member
            </ListItem>
            {(members.length > 0 ?
              members.map((member) => (
                <ListItem
                  key={member.user}
                  onClick={() => onRevokeRequest(member.user)}
                  rightIcon={(member.readOnly) ? (<VisibilityIcon />) : undefined}
                >
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
        onOk={onRevokeDo}
        onCancel={() => setRevokeUser(null)}
      >
        Would you like to revoke {revokeUser}'s access?<br />
        Please be advised that a malicious user would potentially be able to retain access to encryption keys. Please refer to the FAQ for more information.
      </ConfirmationDialog>

      {addMemberOpen &&
        (sharingAllowed ?
          <JournalMemberAddDialog
            etesync={props.etesync}
            info={info}
            onOk={onMemberAdd}
            onClose={() => setAddMemberOpen(false)}
          />
          :
          <ConfirmationDialog
            title="Now Allowed"
            labelOk="OK"
            open
            onOk={() => setAddMemberOpen(false)}
            onClose={() => setAddMemberOpen(false)}
          >
            Sharing of old-style journals is not allowed. In order to share this journal, create a new one, and copy its contents over using the "import" dialog. If you are experiencing any issues, please contact support.
          </ConfirmationDialog>
        )
      }
    </>
  );
}
