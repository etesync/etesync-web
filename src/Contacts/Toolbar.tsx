import * as React from "react";

import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import { Transition } from "react-transition-group";
import InputAdornment from "@material-ui/core/InputAdornment";

const transitionTimeout = 300;

const transitionStyles = {
  entering: { visibility: "visible", width: "100%", overflow: "hidden" },
  entered: { visibility: "visible", width: "100%" },
  exiting: { visibility: "visible", width: "0%", overflow: "hidden" },
  exited: { visibility: "hidden", width: "0%" },
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
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Toolbar(props: PropsType) {
  const { searchTerm, setSearchTerm } = props;

  const showSearchField = true;
  const classes = useStyles();

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
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
    </div>
  );
}
