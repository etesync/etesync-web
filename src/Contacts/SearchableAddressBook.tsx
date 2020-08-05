// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";

import TextField from "@material-ui/core/TextField";

import IconButton from "@material-ui/core/IconButton";
import IconSearch from "@material-ui/icons/Search";
import IconClear from "@material-ui/icons/Clear";

import { ContactType } from "../pim-types";

import AddressBook from "./AddressBook";

interface PropsType {
  entries: ContactType[];
  onItemClick: (contact: ContactType) => void;
}

export default function SearchableAddressBook(props: PropsType) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const reg = new RegExp(searchQuery, "i");

  return (
    <React.Fragment>
      <TextField
        name="searchQuery"
        value={searchQuery}
        style={{ fontSize: "120%", marginLeft: 20 }}
        placeholder="Find Contacts"
        onChange={(event) => setSearchQuery(event.target.value)}
      />
      {searchQuery &&
        <IconButton onClick={() => setSearchQuery("")}>
          <IconClear />
        </IconButton>
      }
      <IconSearch />
      <AddressBook filter={(ent: ContactType) => ent.fn?.match(reg)} {...props} />
    </React.Fragment>
  );
}
