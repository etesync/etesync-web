import { TaskType } from "../pim-types";
import { ListItem } from "../widgets/List";
import React from "react";

interface PropsType {
  entries: TaskType[];
  onClick: (uid: string) => void;
  selected: string | null;
  thisEntry: TaskType;
}

export default function TaskSelectorListItem(props: PropsType) {
  const tasks = props.entries.filter((e) => e.relatedTo === props.thisEntry.uid);

  return (
    <ListItem
      primaryText={props.thisEntry.title}
      selected={props.selected === props.thisEntry.uid}
      key={props.thisEntry.uid}
      onClick={() => props.onClick(props.thisEntry.uid)}
      nestedItems={tasks.map((e) => 
        <TaskSelectorListItem
          key={e.uid}
          entries={props.entries}
          onClick={props.onClick}
          selected={props.selected}
          thisEntry={e}
        />
      )}
    />
  );
}