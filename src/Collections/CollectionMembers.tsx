// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import * as Etebase from "etebase";

import { List, ListItem } from "../widgets/List";

import IconMemberAdd from "@material-ui/icons/PersonAdd";
import VisibilityIcon from "@material-ui/icons/Visibility";
import AdminIcon from "@material-ui/icons/SupervisedUserCircle";

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
  const [members, setMembers] = React.useState<Etebase.CollectionMember[]>();
  const [revokeUser, setRevokeUser] = React.useState<Etebase.CollectionMember | null>(null);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [error, setError] = React.useState<Error>();

  const { collection, metadata } = props.collection;

  const revokeUserIsAdmin = revokeUser?.accessLevel === Etebase.CollectionAccessLevel.Admin;

  async function fetchMembers() {
    const colMgr = getCollectionManager(etebase);
    const memberManager = colMgr.getMemberManager(collection);
    try {
      const ret: Etebase.CollectionMember[] = [];
      let iterator: string | null = null;
      let done = false;
      while (!done) {
        // FIXME: shouldn't be any
        const members: any = await memberManager.list({ iterator, limit: 30 });
        iterator = members.iterator;
        done = members.done;

        for (const member of members.data) {
          ret.push(member);
        }
      }
      setMembers(ret);
    } catch (e) {
      setError(e);
    }
  }

  React.useEffect(() => {
    fetchMembers();
  }, []);

  async function onRevokeDo() {
    const colMgr = getCollectionManager(etebase);
    const memberManager = colMgr.getMemberManager(collection);
    await memberManager.remove(revokeUser!.username);
    await fetchMembers();
    setRevokeUser(null);
  }

  async function onMemberAdd(username: string, pubkey: Uint8Array, accessLevel: Etebase.CollectionAccessLevel) {
    const inviteMgr = etebase.getInvitationManager();
    await inviteMgr.invite(collection, username, pubkey, accessLevel);
    await fetchMembers();
    setAddMemberOpen(false);
  }

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
              members.map((member) => {
                let rightIcon: React.ReactElement | undefined = undefined;
                if (member.accessLevel === Etebase.CollectionAccessLevel.ReadOnly) {
                  rightIcon = (<div title="Read Only"><VisibilityIcon /></div>);
                } else if (member.accessLevel === Etebase.CollectionAccessLevel.Admin) {
                  rightIcon = (<div title="Admin"><AdminIcon /></div>);
                }
                return (
                  <ListItem
                    key={member.username}
                    onClick={() => setRevokeUser(member)}
                    rightIcon={rightIcon}
                  >
                    {member.username}
                  </ListItem>
                );
              })
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
        onOk={(revokeUserIsAdmin) ? () => setRevokeUser(null) : onRevokeDo}
        onCancel={() => setRevokeUser(null)}
      >
        {(revokeUserIsAdmin) ? (
          <p>
            Revoking admin access is not allowed.
          </p>
        ) : (
          <p>
            Would you like to revoke {revokeUser?.username}'s access?<br />
            Please be advised that a malicious user would potentially be able to retain access to encryption keys. Please refer to the FAQ for more information.
          </p>
        )}
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
