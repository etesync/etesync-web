import { TaskType } from "../pim-types";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List } from "@material-ui/core";
import React from "react";
import TaskSelectorListItem from "./TaskSelectorListItem";

interface PropsType {
  entries: TaskType[];
  orig: string | null;
  open: boolean;
  onConfirm: (entry: string | null) => void;
  onCancel: () => void;
}

export default function TaskSelector(props: PropsType) {

  const itemList = props.entries.filter((e) => !e.relatedTo)
    .map((e) => 
      <TaskSelectorListItem
        key={e.uid}
        entries={props.entries}
        thisEntry={e}
        onClick={props.onConfirm}
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
        <Button color="primary" onClick={() => props.onConfirm(null)}>
          Clear
        </Button>
      </DialogActions>
    </Dialog>
  );
}