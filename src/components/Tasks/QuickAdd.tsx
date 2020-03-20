// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';

import * as EteSync from 'etesync';

import ICAL from 'ical.js';

import uuid from 'uuid';

import TextField from '@material-ui/core/TextField';

import { TaskType, PimType, TaskStatusType } from '../../pim-types';

interface PropsType {
  style: React.CSSProperties;
  onSubmit: (item: PimType, journalUid: string, originalItem?: PimType) => void;
  defaultCollection: EteSync.CollectionInfo;
}

function QuickAdd(props: PropsType) {
  const [title, setTitle] = React.useState('');
  const { style, onSubmit: save, defaultCollection } = props;


  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const task = new TaskType(null);
    task.uid = uuid.v4();
    task.title = title;
    task.status = TaskStatusType.NeedsAction;
    task.lastModified = ICAL.Time.now();

    save(task, defaultCollection.uid, undefined);

    setTitle('');
  }


  return (
    <form onSubmit={handleSubmit} style={style}>
      <TextField
        label="Add a new task"
        variant="outlined"
        fullWidth
        value={title}
        onChange={handleChange}
      />
    </form>
  );
}

export default QuickAdd;