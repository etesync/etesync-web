import * as React from 'react';

import { createSelector } from 'reselect';

import * as EteSync from 'etesync';

import * as uuid from 'uuid';

import { List, ListItem } from '../widgets/List';

import { TaskType, TaskStatusType, PimType } from '../pim-types';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import { Chip } from '@material-ui/core';
import LocalOfferIcon from '@material-ui/icons/LocalOffer';

const TagList = React.memo((props: { tags: any }) => (<div>{Object.keys(props.tags).map((tag, i) => <Chip key={i} color="primary" label={tag} icon={<LocalOfferIcon />} style={{ marginRight: '10px' }} />)
}</div>));

const TaskListItem = React.memo(
  (props: { entry: TaskType, onClick: (entry: TaskType) => void, onSave: (item: PimType, journalUid: string, originalContact?: PimType, goBack?: boolean) => void }) => {
    const { entry, onClick, onSave } = props;
    const title = entry.title;

    const stopPropagation = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
    };

    const toggleComplete = (e: React.ChangeEvent<HTMLInputElement>) => {
      const event = entry.clone();
      event.status = e.target.checked ? TaskStatusType.Completed : TaskStatusType.NeedsAction;
      onSave(event, (entry as any).journalUid, entry, false);
    };

    return <ListItem
      primaryText={title}
      onClick={() => onClick(entry)}
      leftIcon={<Checkbox onClick={stopPropagation} onChange={toggleComplete} checked={entry.status === TaskStatusType.Completed} />}
      rightIcon={entry.tags && <TagList tags={entry.tags} />} />;
  }
);

const AddNewTaskItem = (props: { onCreate: (item: PimType, journalUid: string, originalContact?: PimType, goBack?: boolean) => void, defaultCollection: EteSync.CollectionInfo }) => {
  const [title, setTitle] = React.useState('');

  const create = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const event = new TaskType(null);
      event.uid = uuid.v4();
      event.summary = title;
      event.status = TaskStatusType.NeedsAction;

      props.onCreate(event, props.defaultCollection.uid, undefined, false);

      setTitle('');
    }
  };

  return (
    <ListItem leftIcon={<Checkbox disabled />}>
      <TextField label="New task" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTitle(e.target.value) }} onKeyPress={create} />
    </ListItem>
  );
};

const sortSelector = createSelector(
  (entries: TaskType[]) => entries,
  (entries) => entries.sort((a, b) => a.title.localeCompare(b.title))
);

interface PropsType {
  entries: TaskType[];
  collections: EteSync.CollectionInfo[];
  onItemClick: (entry: TaskType) => void;
  onItemSave: (item: PimType, journalUid: string, originalContact?: PimType) => void;
}

export default React.memo(function TaskList(props: PropsType) {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const entries = props.entries.filter((x) => showCompleted || !x.finished);
  const sortedEntries = sortSelector(entries);

  const itemList = sortedEntries.map((entry) => {
    const uid = entry.uid;

    return <TaskListItem key={uid} entry={entry} onClick={props.onItemClick} onSave={props.onItemSave} />;
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'right' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
            />
          }
          label="Show Completed"
        />
      </div>

      <Divider style={{ marginTop: '1em' }} />
      <List>
        {itemList}

        <AddNewTaskItem onCreate={props.onItemSave} defaultCollection={props.collections[0]} />
      </List>
    </>
  );
});
