import * as React from 'react';

import * as EteSync from 'etesync';

import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import MenuItem from '@material-ui/core/MenuItem';
import SortIcon from '@material-ui/icons/Sort';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { Transition } from 'react-transition-group';
import InputAdornment from '@material-ui/core/InputAdornment';

import { PimType } from '../../pim-types';

import { useSelector, useDispatch } from 'react-redux';

import { setSettings } from '../../store/actions';
import { StoreState } from '../../store';

import Menu from '../../widgets/Menu';

const transitionTimeout = 300;

const transitionStyles = {
  entering: { visibility: 'visible', width: '100%', overflow: 'hidden' },
  entered: { visibility: 'visible', width: '100%' },
  exiting: { visibility: 'visible', width: '0%', overflow: 'hidden' },
  exited: { visibility: 'hidden', width: '0%' },
};

const useStyles = makeStyles((theme) => ({
  button: {
    marginRight: theme.spacing(1),
  },
  textField: {
    transition: `width ${transitionTimeout}ms`,
    marginRight: theme.spacing(1),
  },
}));

interface PropsType {
  defaultCollection: EteSync.CollectionInfo;
  onItemSave: (item: PimType, journalUid: string, originalItem?: PimType) => Promise<void>;
  showCompleted: boolean;
  setShowCompleted: (completed: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Toolbar(props: PropsType) {
  const { showCompleted, setShowCompleted, searchTerm, setSearchTerm } = props;

  const [showSearchField, setShowSearchField] = React.useState(false);
  const [sortAnchorEl, setSortAnchorEl] = React.useState<null | HTMLElement>(null);
  const [optionsAnchorEl, setOptionsAnchorEl] = React.useState<null | HTMLElement>(null);

  const classes = useStyles();

  const dispatch = useDispatch();
  const taskSettings = useSelector((state: StoreState) => state.settings.taskSettings);
  const { sortBy } = taskSettings;

  const toggleSearchField = () => {
    if (showSearchField) {
      setSearchTerm('');
    }
    setShowSearchField(!showSearchField);
  };

  const handleSortChange = (sort: string) => {
    dispatch(setSettings({ taskSettings: { ...taskSettings, sortBy: sort } }));
    setSortAnchorEl(null);
  };

  const SortMenuItem = React.forwardRef(function SortMenuItem(props: { name: string, label: string }, ref) {
    return (
      <MenuItem innerRef={ref} selected={sortBy === props.name} onClick={() => handleSortChange(props.name)}>{props.label}</MenuItem>
    );
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      <Transition in={showSearchField} timeout={transitionTimeout}>
        {(state) => (
          <TextField
            fullWidth
            placeholder="Search"
            value={searchTerm}
            color="secondary"
            variant="standard"
            className={classes.textField}
            style={transitionStyles[state]}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Transition>

      <div className={classes.button}>
        <IconButton size="small" onClick={toggleSearchField}>
          {showSearchField ? <CloseIcon /> : <SearchIcon />}
        </IconButton>
      </div>

      <div className={classes.button}>
        <IconButton
          size="small"
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

      <div className={classes.button}>
        <IconButton
          size="small"
          aria-label="more"
          aria-controls="long-menu"
          aria-haspopup="true"
          onClick={(e) => setOptionsAnchorEl(e.currentTarget)}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
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