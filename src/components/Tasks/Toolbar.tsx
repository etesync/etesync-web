import * as React from 'react';

import * as EteSync from 'etesync';

import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';

import QuickAdd from './QuickAdd';

import { PimType } from '../../pim-types';

import { useSelector, useDispatch } from 'react-redux';

import { setSettings } from '../../store/actions';
import { StoreState } from '../../store';

interface PropsType {
  defaultCollection: EteSync.CollectionInfo;
  onItemSave: (item: PimType, journalUid: string, originalItem?: PimType) => Promise<void>;
  showCompleted: boolean;
  setShowCompleted: (completed: boolean) => void;
}

export default function Toolbar(props: PropsType) {
  const { defaultCollection, onItemSave, showCompleted, setShowCompleted } = props;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const dispatch = useDispatch();
  const taskSettings = useSelector((state: StoreState) => state.settings.taskSettings);

  const handleSelectChange = (e: React.ChangeEvent<{ value: string }>) => {
    dispatch(setSettings({ taskSettings: { ...taskSettings, sortBy: e.target.value } }));
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      {defaultCollection && <QuickAdd style={{ flexGrow: 1, marginRight: '1.75em' }} onSubmit={onItemSave} defaultCollection={defaultCollection} />}

      <FormControl style={{ marginRight: '0.75em' }}>
        <InputLabel>Sort by</InputLabel>
        <Select value={taskSettings.sortBy} onChange={handleSelectChange}>
          <MenuItem value="smart">Smart</MenuItem>
          <MenuItem value="dueDate">Due Date</MenuItem>
          <MenuItem value="priority">Priority</MenuItem>
          <MenuItem value="title">Title</MenuItem>
          <MenuItem value="lastModifiedDate">Last Modified</MenuItem>
        </Select>
      </FormControl>


      <div>
        <IconButton
          aria-label="more"
          aria-controls="long-menu"
          aria-haspopup="true"
          onClick={handleClick}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="simple-menu"
          anchorEl={anchorEl}
          keepMounted
          open={!!anchorEl}
          onClose={handleClose}
        >
          <MenuItem>
            <FormControlLabel
              label="Show completed"
              labelPlacement="start"
              control={<Switch checked={showCompleted} onChange={(_e, checked) => setShowCompleted(checked)} />}
            />
          </MenuItem>
        </Menu>

      </div>
    </div>
  );
}