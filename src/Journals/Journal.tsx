// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import IconButton from '@material-ui/core/IconButton';
import IconEdit from '@material-ui/icons/Edit';
import IconMembers from '@material-ui/icons/People';
import IconImport from '@material-ui/icons/ImportExport';


import AppBarOverride from '../widgets/AppBarOverride';
import Container from '../widgets/Container';

import JournalEntries from '../components/JournalEntries';
import ImportDialog from './ImportDialog';

import { SyncInfo, SyncInfoJournal } from '../SyncGate';

import { Link } from 'react-router-dom';

import { routeResolver } from '../App';

import { CredentialsData, UserInfoData } from '../store';

interface PropsType {
  etesync: CredentialsData;
  userInfo: UserInfoData;
  syncInfo: SyncInfo;
  syncJournal: SyncInfoJournal;
  isOwner: boolean;
}

class Journal extends React.Component<PropsType> {
  public state: {
    tab: number;
    importDialogOpen: boolean;
  };

  constructor(props: PropsType) {
    super(props);

    this.importDialogToggle = this.importDialogToggle.bind(this);
    this.state = {
      tab: 0,
      importDialogOpen: false,
    };
  }

  public render() {
    const { isOwner, syncJournal } = this.props;

    const journal = syncJournal.journal;
    const collectionInfo = syncJournal.collection;
    const syncEntries = syncJournal.entries;

    return (
      <React.Fragment>
        <AppBarOverride title={collectionInfo.displayName}>
          {isOwner &&
            <>
              <IconButton
                component={Link}
                title="Edit"
                {...{ to: routeResolver.getRoute('journals._id.edit', { journalUid: journal.uid }) }}
              >
                <IconEdit />
              </IconButton>
              <IconButton
                component={Link}
                title="Members"
                {...{ to: routeResolver.getRoute('journals._id.members', { journalUid: journal.uid }) }}
              >
                <IconMembers />
              </IconButton>
            </>
          }
          <IconButton
            title="Import"
            onClick={this.importDialogToggle}
          >
            <IconImport />
          </IconButton>
        </AppBarOverride>
        <Container>
          <JournalEntries journal={journal} entries={syncEntries} />
        </Container>

        <ImportDialog
          etesync={this.props.etesync}
          userInfo={this.props.userInfo}
          syncJournal={this.props.syncJournal}
          open={this.state.importDialogOpen}
          onClose={this.importDialogToggle}
        />
      </React.Fragment>
    );
  }

  private importDialogToggle() {
    this.setState((state: any) => ({ importDialogOpen: !state.importDialogOpen }));
  }
}

export default Journal;
