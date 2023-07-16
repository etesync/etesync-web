import { useState } from "react";
import { TaskType } from "../pim-types";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List } from "@material-ui/core";
import React from "react";
import TaskSelectorListItem from "./TaskSelectorListItem";

interface PropsType {
  entries: TaskType[];
  orig: string;
  open: boolean;
  onConfirm: (entry: string | null) => void;
  onCancel: () => void;
}

export default function TaskSelector(props: PropsType) {
  const [itemId, setItemId] = useState<string | null>(props.orig);

  const select = () => {
    if (itemId) {
      props.onConfirm(itemId);
    }
  };

  const itemList = props.entries.filter((e) => !e.relatedTo)
    .map((e) => 
      <TaskSelectorListItem
        key={e.uid}
        entries={props.entries}
        thisEntry={e}
        onClick={setItemId}
        selected={itemId}
      />
    );

  return (
    <Dialog open={props.open} onClose={props.onCancel} fullWidth>
      <DialogTitle>
        Select parent task
      </DialogTitle>
      <DialogContent>
        <List>
          {itemList}
        </List>
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button color="primary" onClick={() => props.onConfirm(null)}>
          Clear
        </Button>
        <Button color="primary" onClick={select}>
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
}