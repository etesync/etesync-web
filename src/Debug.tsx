// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import * as Etebase from "etebase";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import Container from "./widgets/Container";
import { useSelector } from "react-redux";
import { StoreState } from "./store";
import { useCredentials } from "./credentials";
import { getCollectionManager } from "./etebase-helpers";

export default function Debug() {
  const etebase = useCredentials()!;
  const [stateCollectionUid, setCollectionUid] = React.useState("");
  const [itemsUids, setEntriesUids] = React.useState("");
  const [result, setResult] = React.useState("");
  const cacheCollections = useSelector((state: StoreState) => state.cache2.collections);
  const cacheItems = useSelector((state: StoreState) => state.cache2.items);

  function handleInputChange(func: (value: string) => void) {
    return (event: React.ChangeEvent<any>) => {
      func(event.target.value);
    };
  }

  return (
    <Container>
      <div>
        <TextField
          style={{ width: "100%" }}
          type="text"
          label="Collection UID"
          value={stateCollectionUid}
          onChange={handleInputChange(setCollectionUid)}
        />
      </div>
      <div>
        <TextField
          style={{ width: "100%" }}
          type="text"
          multiline
          label="Item UIDs"
          value={itemsUids}
          onChange={handleInputChange(setEntriesUids)}
        />
      </div>
      <Button
        variant="contained"
        color="secondary"
        onClick={async () => {
          const colUid = stateCollectionUid.trim();
          const cachedCollection = cacheCollections.get(colUid);
          const colItems = cacheItems.get(colUid);
          if (!colItems || !cachedCollection) {
            setResult("Error: collection uid not found.");
            return;
          }

          const colMgr = getCollectionManager(etebase);
          const col = await colMgr.cacheLoad(cachedCollection);
          const itemMgr = colMgr.getItemManager(col);

          const wantedEntries = {};
          const wantAll = (itemsUids.trim() === "all");
          itemsUids.split("\n").forEach((ent) => wantedEntries[ent.trim()] = true);

          const retEntries = [];
          console.log(wantAll, colItems.size);
          for (const cached of colItems.values()) {
            const item = await itemMgr.cacheLoad(cached);
            const meta = await item.getMeta();
            const content = await item.getContent(Etebase.OutputFormat.String);
            if (wantAll || wantedEntries[item.uid]) {
              retEntries.push(`${JSON.stringify(meta)}\n${content}`);
            }
          }

          setResult(retEntries.join("\n\n"));
        }}
      >
        Decrypt
      </Button>
      <div>
        <p>Result:</p>
        <pre>{result}</pre>
      </div>
    </Container>
  );
}
