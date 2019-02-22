import * as Immutable from 'immutable';

import * as React from 'react';
import { List, ListItem } from '../widgets/List';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import IconAdd from '@material-ui/icons/Add';
import IconDelete from '@material-ui/icons/Delete';
import IconEdit from '@material-ui/icons/Edit';

import * as ICAL from 'ical.js';

import { TaskType, EventType, ContactType } from '../pim-types';

import * as EteSync from '../api/EteSync';

class JournalEntries extends React.PureComponent {
  public static defaultProps = {
    prevUid: null,
  };

  public state: {
    dialog?: string;
  };

  public props: {
    journal: EteSync.Journal,
    entries: Immutable.List<EteSync.SyncEntry>,
    uid?: string,
  };

  constructor(props: any) {
    super(props);
    this.state = {};
  }

  public render() {
    if (this.props.journal === undefined) {
      return (<div>Loading</div>);
    }

    const entries = this.props.entries.map((syncEntry, idx) => {
      const comp = new ICAL.Component(ICAL.parse(syncEntry.content));

      let icon;
      if (syncEntry.action === EteSync.SyncEntryAction.Add) {
        icon = (<IconAdd style={{color: '#16B14B'}} />);
      } else if (syncEntry.action === EteSync.SyncEntryAction.Change) {
        icon = (<IconEdit style={{color: '#FEB115'}} />);
      } else if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
        icon = (<IconDelete style={{color: '#F20C0C'}} />);
      }

      let name;
      let uid;
      if (comp.name === 'vcalendar') {
        if (EventType.isEvent(comp)) {
          const vevent = EventType.fromVCalendar(comp);
          name = vevent.summary;
          uid = vevent.uid;
        } else {
          const vtodo = TaskType.fromVCalendar(comp);
          name = vtodo.summary;
          uid = vtodo.uid;
        }
      } else if (comp.name === 'vcard') {
        const vcard = new ContactType(comp);
        name = vcard.fn;
        uid = vcard.uid;
      } else {
        name = 'Error processing entry';
        uid = '';
      }

      if (this.props.uid && (this.props.uid !== uid)) {
        return undefined;
      }

      return (
        <ListItem
          key={idx}
          leftIcon={icon}
          primaryText={name}
          secondaryText={uid}
          onClick={() => {
            this.setState({
              dialog: syncEntry.content,
            });
          }}
        />
        );
    }).reverse();

    return (
      <div>
        <Dialog
          open={this.state.dialog !== undefined}
          onClose={() => {
            this.setState({dialog: undefined});
          }}
        >
          <DialogTitle>
            Raw Content
          </DialogTitle>
          <DialogContent>
            <pre>{this.state.dialog}</pre>
          </DialogContent>
          <DialogActions>
            <Button
              color="primary"
              onClick={() => {
                this.setState({dialog: undefined});
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <List>
          {entries}
        </List>
      </div>
    );
  }
}

export default JournalEntries;
