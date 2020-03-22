import * as React from 'react';

import * as EteSync from 'etesync';

import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import SortIcon from '@material-ui/icons/Sort';

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

  const [sortAnchorEl, setSortAnchorEl] = React.useState<null | HTMLElement>(null);
  const [optionsAnchorEl, setOptionsAnchorEl] = React.useState<null | HTMLElement>(null);

  const dispatch = useDispatch();
  const taskSettings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { sortBy } = taskSettings;

  const handleSortChange = (sort: string) => {
    dispatch(setSettings({ taskSettings: { ...taskSettings, sortBy: sort } }));
  };

  const SortMenuItem = (props: { name: string, label: string }) => (
    <MenuItem selected={sortBy === props.name} onClick={() => handleSortChange(props.name)}>{props.label}</MenuItem>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      {defaultCollection && <QuickAdd style={{ flexGrow: 1, marginRight: '0.75em' }} onSubmit={onItemSave} defaultCollection={defaultCollection} />}

      <div>
        <IconButton
          aria-label="more"
          aria-controls="long-menu"
          aria-haspopup="true"
          onClick={(e) => setSortAnchorEl(e.currentTarget)}
        >
          <SortIcon />
        </IconButton>
        <Menu
          anchorEl={sortAnchorEl}
          keepMounted
          open={!!sortAnchorEl}
          onClose={() => setSortAnchorEl(null)}
        >
          <SortMenuItem name="smart" label="Smart" />
          <SortMenuItem name="dueDate" label="Due Date" />
          <SortMenuItem name="priority" label="Priority" />
          <SortMenuItem name="title" label="Title" />
          <SortMenuItem name="lastModifiedDate" label="Last Modified" />
        </Menu>
      </div>


      <div>
        <IconButton
          aria-label="more"
          aria-controls="long-menu"
          aria-haspopup="true"
          onClick={(e) => setOptionsAnchorEl(e.currentTarget)}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="simple-menu"
          anchorEl={optionsAnchorEl}
          keepMounted
          open={!!optionsAnchorEl}
          onClose={() => setOptionsAnchorEl(null)}
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