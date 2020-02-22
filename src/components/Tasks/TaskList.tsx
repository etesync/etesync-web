import React from 'react';

import moment from 'moment';

import { useSelector, useDispatch } from 'react-redux';
import { StoreState } from '../../store';
import { setSettings } from '../../store/actions';

import { Theme, withTheme } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';

import Fuse from 'fuse.js';

import { List } from '../../widgets/List';
import { TaskType, TaskTags, TaskPriorityType } from '../../pim-types';
import TaskListItem from './TaskListItem';
import AddNewTaskItem from './AddNewTaskItem';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';

const comparators = {
  title: (a: TaskType, b: TaskType) => a.title.localeCompare(b.title),
  dueDate: (a: TaskType, b: TaskType) => {
    if (!a.dueDate) { return 1 }
    if (!b.dueDate) { return -1 }
    return a.dueDate.toJSDate() < b.dueDate.toJSDate() ? -1 : 1;
  },
  priority: (a: TaskType, b: TaskType) => {
    if (a.priority === TaskPriorityType.None) { return 1 }
    if (b.priority === TaskPriorityType.None) { return -1 }
    return a.priority - b.priority;
  },
  lastModified: (a: TaskType, b: TaskType) => {
    if (!a.lastModified) { return 1 }
    if (!b.lastModified) { return -1 }
    return a.lastModified.toJSDate() > b.lastModified.toJSDate() ? -1 : 1;
  },
};

const tagFilters = Object.assign(
  {},
  ...TaskTags.map((tag) => ({
    [tag]: (x: TaskType) => x.categories.includes(tag),
  }))
);

// FIXME: this breaks if the user has tags by the name "all" or "today"
const filters = {
  all: () => true,
  today: (x: TaskType) => x.dueDate ? moment(x.dueDate.toJSDate()).isSame(moment(), 'day') : false,
  ...tagFilters,
};

let fuseMemo: {
  tasks: TaskType[];
  fuse: Fuse<TaskType, {}>;
} = { tasks: [], fuse: new Fuse([], {}) };

interface PropsType {
  entries: TaskType[];
  onItemClick: (task: TaskType) => void;
  theme: Theme;
}

export default React.memo(withTheme(function TaskList(props: PropsType) {
  const dispatch = useDispatch();
  const settings = useSelector((state: StoreState) => state.settings.tasks);
  const { sortOrder, showCompleted, filterBy, searchTerm } = settings;

  if (fuseMemo.tasks.length === 0 || (fuseMemo.tasks !== props.entries)) {
    fuseMemo = {
      tasks: props.entries,
      fuse: new Fuse(props.entries, {
        shouldSort: true,
        threshold: 0.6,
        maxPatternLength: 32,
        minMatchCharLength: 2,
        keys: [
          'title',
        ],
      }),
    };
  }

  const handleSearch = (term: string) => {
    if (term) {
      dispatch(setSettings({ tasks: { ...settings, filterBy: 'search', searchTerm: term } }));
    } else {
      // set back to all when clearing the field
      dispatch(setSettings({ tasks: { ...settings, filterBy: 'all', searchTerm: '' } }));
    }
  };

  let tasks = [];
  if (filterBy === 'search') {
    tasks = fuseMemo.fuse.search(searchTerm);
  } else {
    tasks = props.entries.filter(filters[filterBy]);
  }
  tasks = tasks.filter((x) => (showCompleted || !x.finished)).sort(comparators[sortOrder]);

  const itemList = tasks.map((task: TaskType) => {
    const uid = task.uid;

    return <TaskListItem key={uid} task={task} onClick={props.onItemClick} />;
  });

  // counts tags and creates an object with shape { tag: amount }
  const tags = TaskTags.reduce((obj, tag) => ({ ...obj, [tag]: 0 }), {});
  props.entries.filter((x) => (showCompleted || !x.finished)).forEach((entry) => entry.categories.forEach((tag) => {
    if (Object.prototype.hasOwnProperty.call(tags, tag)) { tags[tag]++ }
  }));

  return (
    <Grid container spacing={4}>
      <Grid item xs={2} style={{ borderRight: `1px solid ${props.theme.palette.divider}` }}>
        <Sidebar tags={tags} />
      </Grid>
      <Grid item xs>
        <Toolbar tasks={props.entries} onSearch={handleSearch} />

        <Divider style={{ marginTop: '1em' }} />
        <List>
          {itemList}

          <AddNewTaskItem />
        </List>

      </Grid>
    </Grid>
  );
}));
