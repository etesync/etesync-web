import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import { List, ListItem, ListSubheader, ListDivider } from '../widgets/List';
import ActionCode from '@material-ui/icons/Code';
import ActionHome from '@material-ui/icons/Home';
import ActionBugReport from '@material-ui/icons/BugReport';
import ActionQuestionAnswer from '@material-ui/icons/QuestionAnswer';
import LogoutIcon from '@material-ui/icons/PowerSettingsNew';

const logo = require('../images/logo.svg');

import SideMenuJournals from './SideMenuJournals';
import ErrorBoundary from '../components/ErrorBoundary';

import { routeResolver, getPalette } from '../App';

import { store, JournalsType, UserInfoData, StoreState, CredentialsData } from '../store';
import { logout } from '../store/actions';

import * as C from '../constants';

interface PropsType {
  etesync: CredentialsData | null;
  onCloseDrawerRequest: () => void;
}

type PropsTypeInner = RouteComponentProps<{}> & PropsType & {
  journals: JournalsType;
  userInfo: UserInfoData;
};

class SideMenu extends React.PureComponent<PropsTypeInner> {
  constructor(props: PropsTypeInner) {
    super(props);
    this.logout = this.logout.bind(this);
    this.journalClicked = this.journalClicked.bind(this);
  }

  logout() {
    store.dispatch(logout());
    this.props.onCloseDrawerRequest();
  }

  journalClicked(journalUid: string) {
    this.props.onCloseDrawerRequest();
    this.props.history.push(routeResolver.getRoute('journals._id', { journalUid: journalUid }));
  }

  render() {
    const username = (this.props.etesync && this.props.etesync.credentials.email) ?
      this.props.etesync.credentials.email
      : C.appName;

    let loggedInItems;
    if (this.props.etesync) {
      const journals = (this.props.etesync.encryptionKey && this.props.journals && this.props.journals.value
        && this.props.userInfo) && (

        <React.Fragment>
          <ListDivider />
          <ListSubheader>Journals</ListSubheader>
          <ErrorBoundary>
            <SideMenuJournals
              etesync={this.props.etesync}
              journals={this.props.journals.value}
              userInfo={this.props.userInfo}
              onItemClick={this.journalClicked}
            />
          </ErrorBoundary>
        </React.Fragment>
      );

      loggedInItems = (
        <React.Fragment>
          <ListItem primaryText="Log Out" leftIcon={<LogoutIcon/>}  onClick={this.logout} />
          {journals}
        </React.Fragment>
      );
    }

    return (
      <div style={{ overflowX: 'hidden', width: 250}}>
        <div className="App-drawer-header">
          <img className="App-drawer-logo" src={logo} />
          <div style={{color: getPalette('alternateTextColor')}} >
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

const mapStateToProps = (state: StoreState, props: PropsType) => {
  return {
    journals: state.cache.journals,
    userInfo: state.cache.userInfo.value,
  };
};

export default withRouter(connect(
  mapStateToProps
)(SideMenu));
