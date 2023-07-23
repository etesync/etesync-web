import { TaskType } from "../pim-types";
import { ListItem } from "../widgets/List";
import React from "react";

interface PropsType {
  entries: TaskType[];
  showHidden: boolean;
  showCompleted: boolean;
  onClick: (uid: string) => void;
  thisEntry: TaskType;
}

export default function TaskSelectorListItem(props: PropsType) {
  const tasks = props.entries
    .filter((e) => e.relatedTo === props.thisEntry.uid && (props.showHidden || !e.hidden) && (props.showCompleted || !e.finished));

  return (
    <ListItem
      primaryText={props.thisEntry.title}
      key={props.thisEntry.uid}
      onClick={() => props.onClick(props.thisEntry.uid)}
      nestedItems={tasks.map((e) => 
        <TaskSelectorListItem
          showHidden={props.showHidden}
          showCompleted={props.showCompleted}
          key={e.uid}
          entries={props.entries}
          onClick={props.onClick}
          thisEntry={e}
        />
      )}
    />
  );
}