import * as React from 'react';
import { HashRouter, NavLink } from 'react-router-dom';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { amber500, amber700, lightBlue500, darkBlack, white } from 'material-ui/styles/colors';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import IconButton from 'material-ui/IconButton';
import { List, ListItem } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import ActionCode from 'material-ui/svg-icons/action/code';
import ActionHome from 'material-ui/svg-icons/action/home';
import ActionBugReport from 'material-ui/svg-icons/action/bug-report';
import ActionQuestionAnswer from 'material-ui/svg-icons/action/question-answer';

import NavigationMenu from 'material-ui/svg-icons/navigation/menu';

import './App.css';

import { EteSyncContext } from './EteSyncContext';
import { RouteResolver } from './routes';

import * as C from './Constants';

const logo = require('./images/logo.svg');

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: amber500,
    primary2Color: amber700,
    accent1Color: lightBlue500,
    textColor: darkBlack,
    alternateTextColor: white,
  }
});

export function getPalette(part: string): string {
  const theme = muiTheme;
  if ((theme.palette === undefined) || (theme.palette[part] === undefined)) {
    return '';
  }

  return theme.palette[part];
}

export const routeResolver = new RouteResolver({
  home: '',
  journals: {
    _base: 'journals',
    _id: {
      _base: ':journalUid',
      items: {
        _base: 'items',
        _id: {
          _base: ':itemUid',
        },
      },
      entries: {
        _base: 'entries',
        _id: {
          _base: ':entryUid',
        },
      },
    },
  },
});

class App extends React.Component {
  state: {
    drawerOpen: boolean,
  };

  constructor(props: any) {
    super(props);
    this.state = { drawerOpen: false };

    this.toggleDrawer = this.toggleDrawer.bind(this);
    this.closeDrawer = this.closeDrawer.bind(this);
  }

  toggleDrawer() {
    this.setState({drawerOpen: !this.state.drawerOpen});
  }

  closeDrawer() {
    this.setState({drawerOpen: false});
  }

  render() {
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <HashRouter>
        <div>
          <AppBar
            title={C.appName}
            iconElementLeft={<IconButton onClick={this.toggleDrawer}><NavigationMenu /></IconButton>}
          />
          <Drawer
            docked={false}
            width={250}
            open={this.state.drawerOpen}
            onRequestChange={this.toggleDrawer}
          >
            <div className="App-drawer-header">
              <img className="App-drawer-logo" src={logo} />
              <div style={{color: getPalette('alternateTextColor')}} >
                {C.appName}
              </div>
            </div>
            <List>
              <NavLink
                to={routeResolver.getRoute('home')}
                exact={true}
              >
                <ListItem primaryText="Main" leftIcon={<ActionHome />}  onClick={this.closeDrawer} />
              </NavLink>
              <Divider />
              <Subheader>External Links</Subheader>
              <ListItem primaryText="Website" leftIcon={<ActionHome />} href={C.homePage} />
              <ListItem primaryText="FAQ" leftIcon={<ActionQuestionAnswer />} href={C.faq} />
              <ListItem primaryText="Source Code" leftIcon={<ActionCode />} href={C.sourceCode} />
              <ListItem primaryText="Report Issue" leftIcon={<ActionBugReport />} href={C.reportIssue} />
            </List>
          </Drawer>

          <EteSyncContext />
        </div>
        </HashRouter>
      </MuiThemeProvider>
    );
  }
}

export default App;
