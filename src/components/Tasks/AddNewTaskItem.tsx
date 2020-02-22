import React, { useState, useContext } from 'react';

import ICAL from 'ical.js';
import uuid from 'uuid';

import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';

import { TaskType, TaskStatusType, TaskPriorityType } from '../../pim-types';
import { ListItem } from '../../widgets/List';
import { PimContext } from '../../Pim';

const AddNewTaskItem = () => {
  const [title, setTitle] = useState('');
  const { onItemSave: save, collectionsTaskList: collections } = useContext(PimContext);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const event = new TaskType(null);
      event.uid = uuid.v4();
      event.title = title;
      event.status = TaskStatusType.NeedsAction;
      event.priority = TaskPriorityType.None;
      event.lastModified = ICAL.Time.now();

      save(event, collections[0].uid, undefined, false);

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

export default AddNewTaskItem;
