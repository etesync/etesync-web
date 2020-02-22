import React from 'react';

import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import SearchIcon from '@material-ui/icons/Search';
import Switch from '@material-ui/core/Switch';
import Autocomplete from '@material-ui/lab/Autocomplete';

import { useSelector, useDispatch } from 'react-redux';
import { StoreState } from '../../store';
import { setSettings } from '../../store/actions';

import { TaskType } from '../../pim-types';

interface PropsType {
  tasks: TaskType[];
  onSearch: (term: string) => void;
}

export default React.memo((props: PropsType) => {
  const { tasks, onSearch: search } = props;

  const dispatch = useDispatch();
  const settings = useSelector((state: StoreState) => state.settings.tasks);
  const { sortOrder, showCompleted } = settings;

  const handleSelectChange = (e: React.ChangeEvent<{ value: string }>) => {
    dispatch(setSettings({ tasks: { ...settings, sortOrder: e.target.value } }));
  };

  const handleAutocompleteChange = (_e: React.ChangeEvent<{}>, value: TaskType | string | null) => {
    switch (typeof value) {
      case 'string':
        search(value);
        break;
      case 'object':
        search(value ? value.title : '');
        break;
      default:
        search('');
    }
  };

  const handleSwitchChange = () => {
    dispatch(setSettings({ tasks: { ...settings, showCompleted: !showCompleted } }));
  };

  return (
    <Grid container justify="space-between" alignItems="flex-end">
      <Grid item xs={2}>
        <FormControl fullWidth>
          <InputLabel id="sort-label">Sort</InputLabel>
          <Select
            labelId="sort-label"
            value={sortOrder}
            fullWidth
            onChange={handleSelectChange}
          >
            <MenuItem value="dueDate">Due date</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="lastModified">Last modified</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={6}>
        <Autocomplete
          freeSolo
          options={tasks.map((task) => task.title)}
          onChange={handleAutocompleteChange}
          renderInput={(params) => {
            return (
              <TextField
                {...params}
                label="Search"
                fullWidth
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            );
          }}
        />
      </Grid>

      <Grid item>
        <FormControlLabel
          control={
            <Switch
              checked={showCompleted}
              onChange={handleSwitchChange}
            />
          }
          label="Show Completed"
        />
      </Grid>
    </Grid>
  );
});
