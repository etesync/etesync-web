import { TaskType } from "../pim-types";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, List, Switch } from "@material-ui/core";
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

  const [showHidden, setShowHidden] = React.useState(false);
  const [showCompleted, setShowCompleted] = React.useState(false);

  const itemList = props.entries
    .filter((e) => !e.relatedTo && (showHidden || !e.hidden) && (showCompleted || !e.finished))
    .map((e) => 
      <TaskSelectorListItem
        showHidden={showHidden}
        showCompleted={showCompleted}
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
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
            }
            label="Show completed"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
            }
            label="Show hidden"
          />
        </FormGroup>
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