import * as React from 'react';

import * as EteSync from 'etesync';

import ICAL from 'ical.js';

import uuid from 'uuid';

import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';

import { TaskType, TaskStatusType, PimType } from '../../pim-types';
import { ListItem } from '../../widgets/List';

interface PropsType {
  onSubmit: (item: PimType, journalUid: string, originalContact?: PimType) => void;
  defaultCollection: EteSync.CollectionInfo;
}

const QuickAdd = (props: PropsType) => {
  const [title, setTitle] = React.useState('');
  const { onSubmit: save, defaultCollection } = props;


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const task = new TaskType(null);
      task.uid = uuid.v4();
      task.title = title;
      task.lastModified = ICAL.Time.now();

      save(task, defaultCollection.uid, undefined);

      setTitle('');
    }
  };


  return (
    <ListItem leftIcon={<Checkbox disabled />}>
      <TextField
        label="New task"
        value={title}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
      />
    </ListItem>
  );
};

export default QuickAdd;