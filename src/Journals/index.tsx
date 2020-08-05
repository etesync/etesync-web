// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { Location, History } from "history";
import { Route, Switch } from "react-router";

import Journal from "./Journal";
import JournalEdit from "./JournalEdit";
import JournalMembers from "./JournalMembers";
import JournalsList from "./JournalsList";
import JournalsListImport from "./JournalsListImport";

import { routeResolver } from "../App";

import { store, JournalsData, UserInfoData, CredentialsData } from "../store";
import { addJournal, deleteJournal, updateJournal } from "../store/actions";
import { SyncInfo } from "../SyncGate";

import * as EteSync from "etesync";

class Journals extends React.PureComponent {
  public props: {
    etesync: CredentialsData;
    journals: JournalsData;
    userInfo: UserInfoData;
    syncInfo: SyncInfo;
    history: History;
    location: Location;
  };

  constructor(props: any) {
    super(props);
    this.onCancel = this.onCancel.bind(this);
    this.onItemDelete = this.onItemDelete.bind(this);
    this.onItemSave = this.onItemSave.bind(this);
  }

  public render() {
    return (
      <Switch>
        <Route
          path={routeResolver.getRoute("journals")}
          exact
          render={({ history }) => (
            <>
              <JournalsList
                userInfo={this.props.userInfo}
                etesync={this.props.etesync}
                journals={this.props.journals}
                history={history}
              />
            </>
          )}
        />
        <Route
          path={routeResolver.getRoute("journals.import")}
          exact
          render={() => (
            <>
              <JournalsListImport
                userInfo={this.props.userInfo}
                etesync={this.props.etesync}
                journals={this.props.journals}
                syncInfo={this.props.syncInfo}
              />
            </>
          )}
        />
        <Route
          path={routeResolver.getRoute("journals.new")}
          render={() => (
            <JournalEdit
              syncInfo={this.props.syncInfo}
              onSave={this.onItemSave}
              onDelete={this.onItemDelete}
              onCancel={this.onCancel}
            />
          )}
        />
        <Route
          path={routeResolver.getRoute("journals._id")}
          render={({ match }) => {
            const journalUid = match.params.journalUid;

            const syncJournal = this.props.syncInfo.get(journalUid);
            if (!syncJournal) {
              return (<div>Journal not found!</div>);
            }

            const isOwner = syncJournal.journal.owner === this.props.etesync.credentials.email;

            const collectionInfo = syncJournal.collection;
            return (
              <Switch>
                <Route
                  path={routeResolver.getRoute("journals._id.edit")}
                  render={() => (
                    <JournalEdit
                      syncInfo={this.props.syncInfo}
                      item={collectionInfo}
                      onSave={this.onItemSave}
                      onDelete={this.onItemDelete}
                      onCancel={this.onCancel}
                    />
                  )}
                />
                <Route
                  path={routeResolver.getRoute("journals._id.members")}
                  render={() => (
                    <JournalMembers
                      etesync={this.props.etesync}
                      syncJournal={syncJournal}
                      userInfo={this.props.userInfo}
                    />
                  )}
                />
                <Route
                  path={routeResolver.getRoute("journals._id")}
                  render={() => (
                    <Journal
                      etesync={this.props.etesync}
                      userInfo={this.props.userInfo}
                      syncInfo={this.props.syncInfo}
                      syncJournal={syncJournal}
                      isOwner={isOwner}
                    />
                  )}
                />
              </Switch>
            );
          }}
        />
      </Switch>
    );
  }

  public onItemSave(info: EteSync.CollectionInfo, originalInfo?: EteSync.CollectionInfo) {
    const syncJournal = this.props.syncInfo.get(info.uid);

    const derived = this.props.etesync.encryptionKey;
    const userInfo = this.props.userInfo;
    const existingJournal = (syncJournal) ? syncJournal.journal.serialize() : { uid: info.uid };
    const journal = new EteSync.Journal(existingJournal);
    const keyPair = userInfo.getKeyPair(userInfo.getCryptoManager(derived));
    const cryptoManager = journal.getCryptoManager(derived, keyPair);
    journal.setInfo(cryptoManager, info);

    if (originalInfo) {
      store.dispatch<any>(updateJournal(this.props.etesync, journal)).then(() =>
        this.props.history.goBack()
      );
    } else {
      store.dispatch<any>(addJournal(this.props.etesync, journal)).then(() =>
        this.props.history.goBack()
      );
    }
  }

  public onItemDelete(info: EteSync.CollectionInfo) {
    const syncJournal = this.props.syncInfo.get(info.uid);

    const derived = this.props.etesync.encryptionKey;
    const userInfo = this.props.userInfo;
    const existingJournal = (syncJournal) ? syncJournal.journal.serialize() : { uid: info.uid };
    const journal = new EteSync.Journal(existingJournal);
    const keyPair = userInfo.getKeyPair(userInfo.getCryptoManager(derived));
    const cryptoManager = journal.getCryptoManager(derived, keyPair);
    journal.setInfo(cryptoManager, info);

    store.dispatch<any>(deleteJournal(this.props.etesync, journal)).then(() =>
      this.props.history.push(routeResolver.getRoute("journals"))
    );
  }

  public onCancel() {
    this.props.history.goBack();
  }
}

export default Journals;
