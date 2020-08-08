// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import * as Etebase from "etebase";

import { List, ListItem } from "../widgets/List";

import IconMemberAdd from "@material-ui/icons/PersonAdd";
import VisibilityIcon from "@material-ui/icons/Visibility";

import AppBarOverride from "../widgets/AppBarOverride";
import Container from "../widgets/Container";
import LoadingIndicator from "../widgets/LoadingIndicator";
import ConfirmationDialog from "../widgets/ConfirmationDialog";

import { useCredentials } from "../credentials";
import { getCollectionManager } from "../etebase-helpers";
import { CachedCollection } from "../Pim/helpers";

import CollectionMemberAddDialog from "./CollectionMemberAddDialog";
import Alert from "@material-ui/lab/Alert";

interface PropsType {
  collection: CachedCollection;
}

export default function CollectionMembers(props: PropsType) {
  const etebase = useCredentials()!;
  const [members_, setMembers] = React.useState<Etebase.CollectionMember[]>();
  const [revokeUser, setRevokeUser] = React.useState<string | null>(null);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [error, setError] = React.useState<Error>();

  const { collection, metadata } = props.collection;

  async function fetchMembers() {
    const colMgr = getCollectionManager(etebase);
    const memberManager = colMgr.getMemberManager(collection);
    try {
      const members = await memberManager.list();
      setMembers(members.data);
    } catch (e) {
      setError(e);
    }
  }

  React.useEffect(() => {
    fetchMembers();
  }, []);

  function onRevokeRequest(user: string) {
    setRevokeUser(user);
  }

  async function onRevokeDo() {
    const colMgr = getCollectionManager(etebase);
    const memberManager = colMgr.getMemberManager(collection);
    await memberManager.remove(revokeUser!);
    await fetchMembers();
    setRevokeUser(null);
  }

  async function onMemberAdd(username: string, pubkey: Uint8Array, accessLevel: Etebase.CollectionAccessLevel) {
    const inviteMgr = etebase.getInvitationManager();
    await inviteMgr.invite(collection, username, pubkey, accessLevel);
    await fetchMembers();
    setAddMemberOpen(false);
  }

  const members = members_?.filter((x) => x.username !== etebase.user.username);

  return (
    <>
      <AppBarOverride title={`${metadata.name} - Members`} />
      <Container style={{ maxWidth: "30rem" }}>
        {error && (
          <Alert color="error">
            {error.toString()}
          </Alert>
        )}
        {members ?
          <List>
            <ListItem rightIcon={<IconMemberAdd />} onClick={() => setAddMemberOpen(true)}>
              Invite user
            </ListItem>
            {(members.length > 0 ?
              members.map((member) => (
                <ListItem
                  key={member.username}
                  onClick={() => onRevokeRequest(member.username)}
                  rightIcon={(member.accessLevel === Etebase.CollectionAccessLevel.ReadOnly) ? (<VisibilityIcon />) : undefined}
                >
                  {member.username}
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
        <CollectionMemberAddDialog
          collection={props.collection}
          onOk={onMemberAdd}
          onClose={() => setAddMemberOpen(false)}
        />
      }
    </>
  );
}
