// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import IconButton from "@material-ui/core/IconButton";
import IconEdit from "@material-ui/icons/Edit";
import IconMembers from "@material-ui/icons/People";
import IconImport from "@material-ui/icons/ImportExport";


import AppBarOverride from "../widgets/AppBarOverride";
import Container from "../widgets/Container";

/* FIXME:
import CollectionEntries from "../components/CollectionEntries";
 */
import ImportDialog from "./ImportDialog";

import { Link } from "react-router-dom";

import { routeResolver } from "../App";

import { CachedCollection } from "../Pim/helpers";

interface PropsType {
  collection: CachedCollection;
}

class Collection extends React.Component<PropsType> {
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
    const { collection, metadata } = this.props.collection;
    const isAdmin = true; // FIXME

    return (
      <React.Fragment>
        <AppBarOverride title={metadata.name}>
          {isAdmin &&
            <>
              <IconButton
                component={Link}
                title="Edit"
                {...{ to: routeResolver.getRoute("collections._id.edit", { colUid: collection.uid }) }}
              >
                <IconEdit />
              </IconButton>
              <IconButton
                component={Link}
                title="Members"
                {...{ to: routeResolver.getRoute("collections._id.members", { colUid: collection.uid }) }}
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
          Change entries: TBD
        </Container>
        {/*
        <Container>
          <CollectionEntries collection={collection} entries={syncEntries} />
        </Container>
        */}

        <ImportDialog
          key={this.state.importDialogOpen.toString()}
          collection={this.props.collection}
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

export default Collection;
