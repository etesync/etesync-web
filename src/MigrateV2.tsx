// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import * as EteSync from "etesync";
import * as Etebase from "etebase";
import URI from "urijs";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Switch from "@material-ui/core/Switch";
import { Map as ImmutableMap } from "immutable";

import ContactsIcon from "@material-ui/icons/Contacts";
import CalendarTodayIcon from "@material-ui/icons/CalendarToday";
import FormatListBulletedIcon from "@material-ui/icons/FormatListBulleted";

import { useSelector } from "react-redux";
import { StoreState, CredentialsData, UserInfoData } from "./store";
import AppBarOverride from "./widgets/AppBarOverride";
import ColorBox from "./widgets/ColorBox";
import { List, ListItem } from "./widgets/List";
import { colorIntToHtml } from "./journal-processors";
import { Checkbox, FormGroup, FormControlLabel, CircularProgress } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { arrayToChunkIterator } from "./helpers";
import { ContactType, EventType, TaskType, PimType } from "./pim-types";
import PasswordField from "./widgets/PasswordField";
import Wizard, { PagePropsType, WizardNavigationBar } from "./widgets/Wizard";
import ExternalLink from "./widgets/ExternalLink";

interface PropsType {
  etesync: CredentialsData;
  userInfo: UserInfoData;
}

interface FormErrors {
  errorEmail?: string;
  errorPassword?: string;
  errorServer?: string;

  errorGeneral?: string;
}

export default function MigrateV2(props: PropsType) {
  const [etebase, setEtebase] = React.useState<Etebase.Account>();

  const wizardPages = [
    (pageProps: PagePropsType) => (
      <>
        <div style={{ maxWidth: "50em", textAlign: "center", margin: "auto" }}>
          <h2>Etebase 2.0 Migration tool</h2>
          <p>
            This tool will help you migrate your data to EteSync 2.0.
            The migration doesn't delete any data. It only copies your data over to the new EteSync 2.0 server. This means that there is no risk of data-loss in the migration.
          </p>
        </div>
        <WizardNavigationBar {...pageProps} />
      </>
    ),
    (pageProps: PagePropsType) => (
      <WizardAccountPage {...props} {...pageProps} etebase={etebase} setEtebase={setEtebase} />
    ),
    (pageProps: PagePropsType) => (
      <WizardMigrationPage {...props} {...pageProps} etebase={etebase} />
    ),
    (_props: PagePropsType) => (
      <>
        <div style={{ maxWidth: "50em", textAlign: "center", margin: "auto" }}>
          <h2>Migration finished successfully!</h2>
          <p>
            You should now log into your apps using your EteSync 2.0 credentials, and logout from your EteSync 1.0 accounts.
          </p>
          <p>
            The EteSync 2.0 web client is located at: <ExternalLink href="https://pim.etesync.com">https://pim.etesync.com</ExternalLink>
          </p>
        </div>
      </>
    ),
  ];

  return (
    <>
      <AppBarOverride title="Migrate to EteSync 2.0" />
      <Wizard pages={wizardPages} onFinish={() => 1} style={{ display: "flex", flexDirection: "column", flex: 1 }} />
    </>
  );
}

const PASSWORD_MIN_LENGTH = 8;

interface OurPagePropsType extends PropsType, PagePropsType {
  etebase?: Etebase.Account;
}

export function WizardAccountPage(props: OurPagePropsType & { setEtebase: (etebase: Etebase.Account) => void }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [server, setServer] = React.useState("");
  const [hasAccount, setHasAccount] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const [errors, setErrors] = React.useState<FormErrors>({});
  const email = props.etesync.credentials.email;

  const styles = {
    form: {
    },
    forgotPassword: {
      paddingTop: 20,
    },
    alertInfo: {
      marginTop: 20,
      maxWidth: "50em",
    },
    textField: {
      width: "20em",
      marginTop: 20,
    },
    submit: {
      marginTop: 40,
      marginBottom: 40,
    },
  };

  function handleInputChange(func: (value: string) => void) {
    return (event: React.ChangeEvent<any>) => {
      func(event.target.value);
    };
  }

  async function onSubmit() {
    setLoading(true);
    setProgress("");
    try {
      const errors: FormErrors = {};
      const fieldRequired = "This field is required!";
      if (!username) {
        errors.errorEmail = fieldRequired;
      }
      if (!password) {
        errors.errorPassword = fieldRequired;
      } else if (password.length < PASSWORD_MIN_LENGTH) {
        errors.errorPassword = `Passwourds should be at least ${PASSWORD_MIN_LENGTH} digits long.`;
      }
      if (showAdvanced && !server.startsWith("http")) {
        errors.errorServer = "Server URI must start with http/https://";
      }

      if (Object.keys(errors).length) {
        setErrors(errors);
        return;
      } else {
        setErrors({});
      }

      const serverUrl = (showAdvanced) ? server : undefined;

      let etebase: Etebase.Account;
      if (hasAccount) {
        setProgress("Logging into EteSync 2.0 account");
        etebase = await Etebase.Account.login(username, password, serverUrl);
      } else {
        setProgress("Creating an EteSync 2.0 account");
        const user: Etebase.User = {
          username,
          email,
        };
        // Let the server know the account is asking for a migration
        {
          const serviceUrl = URI(props.etesync.serviceApiUrl).normalize();
          serviceUrl.segment("etesync-v2");
          serviceUrl.segment("confirm-migration");
          serviceUrl.segment("");
          const response = await fetch(serviceUrl.normalize().toString(), {
            method: "post",
            headers: { Authorization: "Token " + props.etesync.credentials.authToken },
          });
          if (!response.ok) {
            try {
              const json = await response.json();
              throw new Error(json.detail ?? JSON.stringify(json));
            } catch (e) {
              throw new Error("Failed preparing account for migration");
            }
          }
        }

        etebase = await Etebase.Account.signup(user, password, serverUrl);
      }
      props.setEtebase(etebase);
      props.next?.();
      setProgress("Done");
    } catch (e) {
      if ((e instanceof Etebase.HttpError) && (e.content)) {
        let found = false;
        if (e.content.errors) {
          for (const field of e.content.errors) {
            if (field.field === "user.username") {
              errors.errorEmail = field.detail;
              found = true;
            } else if (!field.field) {
              errors.errorGeneral = field.detail;
              found = true;
            }
          }
        }

        if (!found) {
          errors.errorGeneral = e.content.detail ?? e.toString();
        }
      } else if (e instanceof Etebase.UnauthorizedError) {
        errors.errorGeneral = "Wrong username or password";
      } else {
        errors.errorGeneral = e.toString();
      }
      setErrors(errors);
    } finally {
      setLoading(false);
    }
  }

  let advancedSettings = null;
  if (showAdvanced) {
    advancedSettings = (
      <React.Fragment>
        <TextField
          type="url"
          style={styles.textField}
          error={!!errors.errorServer}
          helperText={errors.errorServer}
          label="Server"
          name="server"
          value={server}
          onChange={handleInputChange(setServer)}
        />
        <br />
      </React.Fragment>
    );
  }

  if (props.etebase) {
    return (
      <>
        <h2>EteSync 2.0 credentials</h2>
        <p>Already logged in. Click "Next" to continue.</p>
      </>
    );
  }

  return (
    <>
      <h2>EteSync 2.0 credentials</h2>
      <FormControlLabel
        control={<Checkbox checked={hasAccount} onChange={() => setHasAccount(!hasAccount)} />}
        label="I already have an EteSync 2.0 account"
      />
      <br />
      <TextField
        type="text"
        style={styles.textField}
        error={!!errors.errorEmail}
        helperText={errors.errorEmail}
        label="Username"
        name="username"
        value={username}
        onChange={handleInputChange(setUsername)}
      />
      <br />
      <PasswordField
        style={styles.textField}
        error={!!errors.errorPassword}
        helperText={errors.errorPassword}
        label="Password"
        name="password"
        value={password}
        onChange={handleInputChange(setPassword)}
      />
      {!hasAccount && (
        <Alert severity="warning" style={styles.alertInfo}>
          Please make sure you remember your password, as it <em>can't</em> be recovered if lost!
        </Alert>
      )}
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={showAdvanced}
              onChange={() => setShowAdvanced(!showAdvanced)}
            />
          }
          label="Advanced settings"
        />
      </FormGroup>
      {advancedSettings}
      {errors.errorGeneral && (
        <Alert severity="error" style={styles.alertInfo}>{errors.errorGeneral}</Alert>
      )}
      {progress && (
        <Alert severity="info" style={styles.alertInfo}>{progress}</Alert>
      )}
      <div style={styles.submit}>
        <Button
          variant="contained"
          color="secondary"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress />
          ) : (hasAccount) ? "Login" : "Create account"
          }
        </Button>
      </div>
    </>
  );
}

export function WizardMigrationPage(props: OurPagePropsType) {
  const [wantedJournals, setWantedJournals] = React.useState<ImmutableMap<string, EteSync.Journal>>(ImmutableMap({}));
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [progress, setProgress] = React.useState("");
  const [errors, setErrors] = React.useState<FormErrors>({});
  const journals = useSelector((state: StoreState) => state.cache.journals!);
  const journalEntries = useSelector((state: StoreState) => state.cache.entries);
  const derived = props.etesync.encryptionKey;

  const me = props.etesync.credentials.email;

  const decryptedJournals = React.useMemo(() => {
    return journals.map((journal) => {
      const userInfo = props.userInfo;
      const keyPair = userInfo.getKeyPair(userInfo.getCryptoManager(derived));
      const cryptoManager = journal.getCryptoManager(derived, keyPair);
      const info = journal.getInfo(cryptoManager);
      return { journal, info };
    });
  }, [props.userInfo, journals, derived]);

  const journalClicked = React.useCallback((journal: EteSync.Journal) => {
    if (wantedJournals.has(journal.uid)) {
      setWantedJournals(wantedJournals.remove(journal.uid));
    } else {
      setWantedJournals(wantedJournals.set(journal.uid, journal));
    }
  }, [wantedJournals]);

  const journalMap = React.useMemo(() => {
    return decryptedJournals.reduce(
      (ret, { journal, info }) => {
        let colorBox: React.ReactElement | undefined;
        switch (info.type) {
          case "CALENDAR":
          case "TASKS":
            colorBox = (
              <ColorBox size={24} color={colorIntToHtml(info.color)} />
            );
            break;
        }
        ret[info.type] = ret[info.type] || [];
        ret[info.type].push(
          <ListItem key={journal.uid} rightIcon={colorBox} insetChildren
            onClick={() => journalClicked(journal)}>
            <Checkbox
              checked={wantedJournals.has(journal.uid)}
            />
            {info.displayName}
            {((journal.owner !== me) && wantedJournals.has(journal.uid)) && (
              <Alert severity="warning">Migrating a shared collection will only copy its contents, and will not make it shared. Pleaes ask the collection owner to migrate it to EteSync 2.0 and share it with you instead.</Alert>
            )}
          </ListItem>
        );

        return ret;
      },
      {
        CALENDAR: [],
        ADDRESS_BOOK: [],
        TASKS: [],
      });
  }, [decryptedJournals, journalClicked]);

  const styles = {
    form: {
    },
    forgotPassword: {
      paddingTop: 20,
    },
    alertInfo: {
      marginTop: 20,
    },
    textField: {
      width: "20em",
      marginTop: 20,
    },
    submit: {
      marginTop: 40,
    },
  };

  async function onSubmit() {
    setLoading(true);
    setProgress("");
    try {
      let malformed = 0;
      let badMtime = 0;
      const etebase = props.etebase!;
      const colMgr = etebase.getCollectionManager();

      const { etesync, userInfo } = props;
      const derived = etesync.encryptionKey;
      const userInfoCryptoManager = userInfo.getCryptoManager(etesync.encryptionKey);
      const keyPair = userInfo.getKeyPair(userInfoCryptoManager);

      const now = (new Date()).getTime();

      let i = 1;
      for (const journal of wantedJournals.values()) {
        setProgress(`Migrating collection ${i}/${wantedJournals.size}`);
        console.log("Migrating ", journal.uid);

        const cryptoManager = journal.getCryptoManager(derived, keyPair);
        const info = journal.getInfo(cryptoManager);
        const entries = journalEntries.get(journal.uid)!;

        let colType;
        let parseFunc: (content: string) => PimType;
        switch (info.type) {
          case "ADDRESS_BOOK": {
            colType = "etebase.vcard";
            parseFunc = ContactType.parse;
            break;
          }
          case "CALENDAR": {
            colType = "etebase.vevent";
            parseFunc = EventType.parse;
            break;
          }
          case "TASKS": {
            colType = "etebase.vtodo";
            parseFunc = TaskType.parse;
            break;
          }
          default: {
            continue;
          }
        }
        const meta: Etebase.CollectionMetadata = {
          type: colType,
          name: info.displayName,
          description: info.description,
          color: (info.color !== undefined) ? colorIntToHtml(info.color) : undefined,
        };
        const collection = await colMgr.create(meta, "");
        await colMgr.upload(collection);

        const itemMgr = colMgr.getItemManager(collection);

        const CHUNK_SIZE = 20;
        const items = new Map<string, Etebase.Item>();
        let done = 0;
        let prevUid: string | null = null;
        for (const chunk of arrayToChunkIterator(entries.toArray(), CHUNK_SIZE)) {
          setProgress(`Migrating collection ${i}/${wantedJournals.size}\nMigrated entries: ${done}/${entries.size}`);
          const chunkItems = [];
          for (const entry of chunk) {
            console.log("Migrating entry ", entry.uid);
            done++;
            const syncEntry = entry.getSyncEntry(cryptoManager, prevUid);
            prevUid = entry.uid;
            const pimItem = parseFunc(syncEntry.content);
            const uid = pimItem.uid;

            if (!uid) {
              malformed++;
              continue;
            }

            // When we can't set mtime, set to the item's position in the change log so we at least maintain EteSync 1.0 ordering.
            let mtime = (pimItem.lastModified?.toJSDate())?.getTime();
            if (!mtime) {
              mtime = now + done;
              badMtime++;
            }

            let item = items.get(uid);
            if (item) {
              // Existing item
              item = item._clone(); // We are cloning so we can push multiple revisions at once
              await item.setContent(syncEntry.content);
              const meta = await item.getMeta();
              meta.mtime = mtime;
              await item.setMeta(meta);
            } else {
              // New
              const meta: Etebase.ItemMetadata = {
                mtime,
                name: uid,
              };
              item = await itemMgr.create(meta, syncEntry.content);
              items.set(uid, item);
            }
            if (syncEntry.action === EteSync.SyncEntryAction.Delete) {
              item.delete(true);
            }

            chunkItems.push(item);
          }
          await itemMgr.batch(chunkItems);
        }

        i++;
      }

      await etebase.logout();
      {
        let out = "Done";
        if (badMtime > 0) {
          out += `\nModification time missing for ${badMtime} entries (setting to "now")`;
        } else if (malformed > 0) {
          out += `\nIgnored ${malformed} entries (probably safe to ignore)`;
        }
        setProgress(out);
      }
      setDone(true);

    } catch (e) {
      errors.errorGeneral = e.toString();
      setErrors(errors);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2>Choose collections to migrate</h2>
      <List>
        <ListItem
          primaryText="Address Books"
          leftIcon={<ContactsIcon />}
          nestedItems={journalMap.ADDRESS_BOOK}
        />

        <ListItem
          primaryText="Calendars"
          leftIcon={<CalendarTodayIcon />}
          nestedItems={journalMap.CALENDAR}
        />

        <ListItem
          primaryText="Tasks"
          leftIcon={<FormatListBulletedIcon />}
          nestedItems={journalMap.TASKS}
        />
      </List>

      {errors.errorGeneral && (
        <Alert severity="error" style={styles.alertInfo}>{errors.errorGeneral}</Alert>
      )}
      {progress && (
        <Alert severity="info" style={styles.alertInfo}>{progress}</Alert>
      )}
      <div style={styles.submit}>
        {(done) ? (
          <Button
            variant="contained"
            color="secondary"
            onClick={props.next}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress />
            ) : "Migrate"
            }
          </Button>
        )}
      </div>
    </>
  );
}
