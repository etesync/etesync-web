import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import { List, ListItem, ListSubheader, ListDivider } from '../widgets/List';
import { Theme, withTheme } from '@material-ui/core/styles';
import ActionCode from '@material-ui/icons/Code';
import ActionHome from '@material-ui/icons/Home';
import ActionSettings from '@material-ui/icons/Settings';
import ActionJournals from '@material-ui/icons/LibraryBooks';
import ActionBugReport from '@material-ui/icons/BugReport';
import ActionQuestionAnswer from '@material-ui/icons/QuestionAnswer';
import LogoutIcon from '@material-ui/icons/PowerSettingsNew';
import IconImport from '@material-ui/icons/ImportExport';

import logo from '../images/logo.svg';

import { routeResolver } from '../App';

import { store, UserInfoData, StoreState, CredentialsData } from '../store';
import { logout } from '../store/actions';

import * as C from '../constants';

interface PropsType {
  etesync: CredentialsData | null;
  onCloseDrawerRequest: () => void;
}

type PropsTypeInner = RouteComponentProps<{}> & PropsType & {
  userInfo: UserInfoData;
  theme: Theme;
};

class SideMenu extends React.PureComponent<PropsTypeInner> {
  constructor(props: PropsTypeInner) {
    super(props);
    this.logout = this.logout.bind(this);
  }

  public logout() {
    store.dispatch(logout(this.props.etesync!));
    this.props.onCloseDrawerRequest();
  }

  public render() {
    const { theme } = this.props;
    const username = (this.props.etesync && this.props.etesync.credentials.email) ?
      this.props.etesync.credentials.email
      : C.appName;

    let loggedInItems;
    if (this.props.etesync) {
      loggedInItems = (
        <React.Fragment>
          <ListItem
            primaryText="Journals"
            leftIcon={<ActionJournals />}
            onClick={() => {
              this.props.onCloseDrawerRequest();
              this.props.history.push(routeResolver.getRoute('journals'));
            }}
          />
          <ListItem
            primaryText="Import"
            leftIcon={<IconImport />}
            onClick={() => {
              this.props.onCloseDrawerRequest();
              this.props.history.push(routeResolver.getRoute('journals.import'));
            }}
          />
          <ListItem
            primaryText="Settings"
            leftIcon={<ActionSettings />}
            onClick={() => {
              this.props.onCloseDrawerRequest();
              this.props.history.push(routeResolver.getRoute('settings'));
            }}
          />
          <ListItem primaryText="Log Out" leftIcon={<LogoutIcon />} onClick={this.logout} />
        </React.Fragment>
      );
    }

    return (
      <div style={{ overflowX: 'hidden', width: 250 }}>
        <div className="App-drawer-header">
          <img alt="App logo" className="App-drawer-logo" src={logo} />
          <div style={{ color: theme.palette.secondary.contrastText }}>
            {username}
          </div>
        </div>
        <List>
          <ListItem
            primaryText="Main"
            leftIcon={<ActionHome />}
            onClick={() => {
              this.props.onCloseDrawerRequest();
              this.props.history.push(routeResolver.getRoute('home'));
            }}
          />
          {loggedInItems}
          <ListDivider />
          <ListSubheader>External Links</ListSubheader>
          <ListItem primaryText="Website" leftIcon={<ActionHome />} href={C.homePage} />
          <ListItem primaryText="FAQ" leftIcon={<ActionQuestionAnswer />} href={C.faq} />
          <ListItem primaryText="Source Code" leftIcon={<ActionCode />} href={C.sourceCode} />
          <ListItem primaryText="Report Issue" leftIcon={<ActionBugReport />} href={C.reportIssue} />
        </List>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState, _props: PropsType) => {
  return {
    userInfo: state.cache.userInfo,
  };
};

export default withTheme(withRouter(connect(
  mapStateToProps
)(SideMenu)));
