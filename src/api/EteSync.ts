import * as sjcl from 'sjcl';
import URI from 'urijs';

import * as Constants from './Constants';

import { byte, base64, stringToByteArray } from './Helpers';
import { CryptoManager, AsymmetricKeyPair, HMAC_SIZE_BYTES } from './Crypto';
export { CryptoManager, AsymmetricCryptoManager, AsymmetricKeyPair, deriveKey, genUid } from './Crypto';

class ExtendableError extends Error {
  constructor(message: any) {
    super(message);
    Object.setPrototypeOf(this, ExtendableError.prototype);
    this.name = this.constructor.name;
    this.stack = (new Error(message)).stack;
  }
}

export class HTTPError extends ExtendableError {
  constructor(message: any) {
    super(message);
    Object.setPrototypeOf(this, HTTPError.prototype);
    this.name = this.constructor.name;
  }
}

export class IntegrityError extends ExtendableError {
  constructor(message: any) {
    super(message);
    Object.setPrototypeOf(this, IntegrityError.prototype);
    this.name = this.constructor.name;
  }
}

// FIXME: Make secure + types
function CastJson(json: any, to: any) {
  return Object.assign(to, json);
}

function hmacToHex(hmac: byte[]): string {
    return sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(hmac));
}

export class Credentials {
  email: string;
  authToken: string;

  constructor(email: string, authToken: string) {
    this.email = email;
    this.authToken = authToken;
  }
}

export class CollectionInfo {
  uid: string;
  type: string;
  displayName: string;
  description: string;
  color: number;

  constructor(json?: any) {
    CastJson(json, this);
  }
}

interface BaseItemJson {
  content: base64;
}

class BaseItem<T extends BaseItemJson> {
  protected _json: T;
  protected _encrypted: byte[];
  protected _content?: object;

  constructor() {
    this._json = {} as any;
  }

  deserialize(json: T) {
    this._json = Object.assign({}, json);
    this._encrypted = sjcl.codec.bytes.fromBits(sjcl.codec.base64.toBits(json.content));
    this._content = undefined;
  }

  serialize(): T {
    return Object.assign(
      {},
      this._json,
      { content: sjcl.codec.base64.fromBits(sjcl.codec.bytes.toBits(this._encrypted)) }
    );
  }

  protected verifyBase(hmac: byte[], calculated: byte[]) {
    if (!this.hmacEqual(hmac, calculated)) {
      throw new IntegrityError('Bad HMAC. ' + hmacToHex(hmac) + ' != ' + hmacToHex(calculated));
    }
  }

  private hmacEqual(hmac: byte[], calculated: byte[]) {
    return (hmac.length === calculated.length) &&
      (hmac.every((v, i) => v === calculated[i]));
  }
}

interface BaseJson extends BaseItemJson {
  uid: string;
}

class BaseJournal<T extends BaseJson> extends BaseItem<T> {
  get uid(): string {
    return this._json.uid;
  }
}

export interface JournalJson extends BaseJson {
  version: number;
  owner: string;
  key?: base64;
}

export class Journal extends BaseJournal<JournalJson> {
  constructor(version: number = Constants.CURRENT_VERSION) {
    super();
    this._json.version = version;
  }

  get key(): byte[] | undefined {
    if (this._json.key) {
      return sjcl.codec.bytes.fromBits(sjcl.codec.base64.toBits(this._json.key));
    }

    return undefined;
  }

  get owner(): string | undefined {
    return this._json.owner;
  }

  get version(): number {
    return this._json.version;
  }

  setInfo(cryptoManager: CryptoManager, info: CollectionInfo) {
    this._json.uid = info.uid;
    this._content = info;
    const encrypted = cryptoManager.encrypt(JSON.stringify(this._content));
    this._encrypted = this.calculateHmac(cryptoManager, encrypted).concat(encrypted);
  }

  getInfo(cryptoManager: CryptoManager): CollectionInfo {
    this.verify(cryptoManager);

    if (this._content === undefined) {
      this._content = JSON.parse(cryptoManager.decrypt(this.encryptedContent()));
    }

    let ret = new CollectionInfo(this._content);
    ret.uid = this.uid;
    return ret;
  }

  calculateHmac(cryptoManager: CryptoManager, encrypted: byte[]): byte[] {
    let prefix = stringToByteArray(this.uid);
    return cryptoManager.hmac(prefix.concat(encrypted));
  }

  verify(cryptoManager: CryptoManager) {
    let calculated = this.calculateHmac(cryptoManager, this.encryptedContent());
    let hmac = this._encrypted.slice(0, HMAC_SIZE_BYTES);

    super.verifyBase(hmac, calculated);
  }

  private encryptedContent(): byte[] {
    return this._encrypted.slice(HMAC_SIZE_BYTES);
  }
}

export enum SyncEntryAction {
  Add = 'ADD',
  Delete = 'DELETE',
  Change = 'CHANGE',
}

export class SyncEntry {
  uid?: string;
  action: SyncEntryAction;
  content: string;

  constructor(json?: any, uid?: string) {
    CastJson(json, this);
    this.uid = uid;
  }
}

export interface EntryJson extends BaseJson {
}

export class Entry extends BaseJournal<EntryJson> {
  setSyncEntry(cryptoManager: CryptoManager, info: SyncEntry, prevUid: string | null) {
    this._content = info;
    this._encrypted = cryptoManager.encrypt(JSON.stringify(this._content));
    this._json.uid = hmacToHex(this.calculateHmac(cryptoManager, this._encrypted, prevUid));
  }

  getSyncEntry(cryptoManager: CryptoManager, prevUid: string | null): SyncEntry {
    this.verify(cryptoManager, prevUid);

    if (this._content === undefined) {
      this._content = JSON.parse(cryptoManager.decrypt(this._encrypted));
    }

    return new SyncEntry(this._content, this.uid);
  }

  verify(cryptoManager: CryptoManager, prevUid: string | null) {
    let calculated = this.calculateHmac(cryptoManager, this._encrypted, prevUid);
    let hmac = sjcl.codec.bytes.fromBits(sjcl.codec.hex.toBits(this.uid));

    super.verifyBase(hmac, calculated);
  }

  private calculateHmac(cryptoManager: CryptoManager, encrypted: byte[], prevUid: string | null): byte[] {
    let prefix = (prevUid !== null) ? stringToByteArray(prevUid) : [];
    return cryptoManager.hmac(prefix.concat(encrypted));
  }
}

export interface UserInfoJson extends BaseItemJson {
  version?: number;
  owner?: string;
  pubkey: base64;
}

export class UserInfo extends BaseItem<UserInfoJson> {
  _owner: string;

  constructor(owner: string, version: number = Constants.CURRENT_VERSION) {
    super();
    this._json.version = version;
    this._owner = owner;
  }

  get version(): number {
    return this._json.version!;
  }

  get owner(): string {
    return this._owner;
  }

  get publicKey() {
    return this._json.pubkey;
  }

  serialize(): UserInfoJson {
    let ret = super.serialize();
    ret.owner = this._owner;
    return ret;
  }

  setKeyPair(cryptoManager: CryptoManager, keyPair: AsymmetricKeyPair) {
    this._json.pubkey = sjcl.codec.base64.fromBits(sjcl.codec.bytes.toBits(keyPair.publicKey));
    this._content = keyPair.privateKey;
    const encrypted = cryptoManager.encryptBytes(keyPair.privateKey);
    this._encrypted = this.calculateHmac(cryptoManager, encrypted).concat(encrypted);
  }

  getKeyPair(cryptoManager: CryptoManager): AsymmetricKeyPair {
    this.verify(cryptoManager);

    if (this._content === undefined) {
      this._content = cryptoManager.decryptBytes(this.encryptedContent());
    }

    const pubkey = sjcl.codec.bytes.fromBits(sjcl.codec.base64.toBits(this._json.pubkey));
    return new AsymmetricKeyPair(pubkey, this._content as byte[]);
  }

  calculateHmac(cryptoManager: CryptoManager, encrypted: byte[]): byte[] {
    let postfix = sjcl.codec.bytes.fromBits(sjcl.codec.base64.toBits(this._json.pubkey));
    return cryptoManager.hmac(encrypted.concat(postfix));
  }

  verify(cryptoManager: CryptoManager) {
    let calculated = this.calculateHmac(cryptoManager, this.encryptedContent());
    let hmac = this._encrypted.slice(0, HMAC_SIZE_BYTES);

    super.verifyBase(hmac, calculated);
  }

  private encryptedContent(): byte[] {
    return this._encrypted.slice(HMAC_SIZE_BYTES);
  }
}

// FIXME: baseUrl and apiBase should be the right type all around.

class BaseNetwork {
  apiBase: any; // FIXME

  static urlExtend(_baseUrl: URL, segments: Array<string>): URL {
    let baseUrl = _baseUrl as any;
    baseUrl = baseUrl.clone();
    for (const segment of segments) {
      baseUrl.segment(segment);
    }
    return baseUrl.normalize();
  }

  constructor(apiBase: string) {
    this.apiBase = URI(apiBase).normalize();
  }

  // FIXME: Get the correct type for extra
  newCall(segments: Array<string> = [], extra: any = {}, _apiBase: URL = this.apiBase): Promise<{} | Array<any>> {
    let apiBase = BaseNetwork.urlExtend(_apiBase, segments);

    extra = Object.assign({}, extra);
    extra.headers = Object.assign(
      { 'Accept': 'application/json' },
      extra.headers);

    return new Promise((resolve, reject) => {
      fetch(apiBase.toString(), extra).then((response) => {
        response.text().then((text) => {
          let json: any;
          let body: any = text;
          try {
            json = JSON.parse(text);
            body = json;
          } catch (e) {
            body = text;
          }

          if (response.ok) {
            resolve(body);
          } else {
            if (json) {
              reject(new HTTPError(json.detail || json.non_field_errors || JSON.stringify(json)));
            } else {
              reject(new HTTPError(body));
            }
          }
        }).catch((error) => {
          reject(error);
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }
}

export class Authenticator extends BaseNetwork {
  constructor(apiBase: string) {
    super(apiBase);
    this.apiBase = BaseNetwork.urlExtend(this.apiBase, ['api-token-auth', '']);
  }

  getAuthToken(username: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // FIXME: should be FormData but doesn't work for whatever reason
      let form = 'username=' + encodeURIComponent(username) +
        '&password=' + encodeURIComponent(password);
      const extra = {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: form
      };

      this.newCall([], extra).then((json: {token: string}) => {
        resolve(json.token);
      }).catch((error: Error) => {
        reject(error);
      });
    });
  }
}

export class BaseManager extends BaseNetwork {
  protected credentials: Credentials;

  constructor(credentials: Credentials, apiBase: string, segments: Array<string>) {
    super(apiBase);
    this.credentials = credentials;
    this.apiBase = BaseNetwork.urlExtend(this.apiBase, ['api', 'v1'].concat(segments));
  }

  // FIXME: Get the correct type for extra
  newCall(segments: Array<string> = [], extra: any = {}, apiBase: any = this.apiBase): Promise<{} | Array<any>> {
    extra = Object.assign({}, extra);
    extra.headers = Object.assign(
      {
        'Content-Type': 'application/json;charset=UTF-8',
        'Authorization': 'Token ' + this.credentials.authToken
      },
      extra.headers);

    return super.newCall(segments, extra, apiBase);
  }
}

export class JournalManager extends BaseManager {
  constructor(credentials: Credentials, apiBase: string) {
    super(credentials, apiBase, ['journals', '']);
  }

  fetch(journalUid: string): Promise<Journal> {
    return new Promise((resolve, reject) => {
      this.newCall([journalUid, '']).then((json: JournalJson) => {
        let journal = new Journal(json.version);
        journal.deserialize(json);
        resolve(journal);
      }).catch((error: Error) => {
        reject(error);
      });
    });
  }

  list(): Promise<Journal[]> {
    return new Promise((resolve, reject) => {
      this.newCall().then((json: Array<{}>) => {
        resolve(json.map((val: JournalJson) => {
          let journal = new Journal(val.version);
          journal.deserialize(val);
          return journal;
        }));
      }).catch((error: Error) => {
        reject(error);
      });
    });
  }

  create(journal: Journal): Promise<{}> {
    const extra = {
      method: 'post',
      body: JSON.stringify(journal.serialize()),
    };

    return this.newCall([], extra);
  }

  update(journal: Journal): Promise<{}> {
    const extra = {
      method: 'put',
      body: JSON.stringify(journal.serialize()),
    };

    return this.newCall([journal.uid, ''], extra);
  }

  delete(journal: Journal): Promise<{}> {
    const extra = {
      method: 'delete',
    };

    return this.newCall([journal.uid, ''], extra);
  }
}

export class EntryManager extends BaseManager {
  constructor(credentials: Credentials, apiBase: string, journalId: string) {
    super(credentials, apiBase, ['journals', journalId, 'entries', '']);
  }

  list(lastUid: string | null, limit: number = 0): Promise<Entry[]> {
    let apiBase = this.apiBase.clone();
    apiBase = apiBase.search({
      last: (lastUid !== null) ? lastUid : undefined,
      limit: (limit > 0) ? limit : undefined,
    });

    return new Promise((resolve, reject) => {
      this.newCall(undefined, undefined, apiBase).then((json: Array<{}>) => {
        resolve(json.map((val: any) => {
          let entry = new Entry();
          entry.deserialize(val);
          return entry;
        }));
      }).catch((error: Error) => {
        reject(error);
      });
    });
  }

  create(entries: Entry[], lastUid: string | null): Promise<{}> {
    let apiBase = this.apiBase.clone();
    apiBase = apiBase.search({
      last: (lastUid !== null) ? lastUid : undefined,
    });

    const extra = {
      method: 'post',
      body: JSON.stringify(entries.map((x) => x.serialize())),
    };

    return this.newCall(undefined, extra, apiBase);
  }
}

export interface JournalMemberJson {
  user: string;
  key: base64;
}

export class JournalMembersManager extends BaseManager {
  constructor(credentials: Credentials, apiBase: string, journalId: string) {
    super(credentials, apiBase, ['journals', journalId, 'members', '']);
  }

  list(): Promise<JournalMemberJson[]> {
    return new Promise((resolve, reject) => {
      this.newCall().then((json: Array<{}>) => {
        resolve(json.map((val: JournalMemberJson) => {
          return val;
        }));
      }).catch((error: Error) => {
        reject(error);
      });
    });
  }
}

export class UserInfoManager extends BaseManager {
  constructor(credentials: Credentials, apiBase: string) {
    super(credentials, apiBase, ['user', '']);
  }

  fetch(owner: string): Promise<UserInfo> {
    return new Promise((resolve, reject) => {
      this.newCall([owner, '']).then((json: UserInfoJson) => {
        let userInfo = new UserInfo(owner, json.version);
        userInfo.deserialize(json);
        resolve(userInfo);
      }).catch((error: Error) => {
        reject(error);
      });
    });
  }

  create(userInfo: UserInfo): Promise<{}> {
    const extra = {
      method: 'post',
      body: JSON.stringify(userInfo.serialize()),
    };

    return this.newCall([], extra);
  }

  update(userInfo: UserInfo): Promise<{}> {
    const extra = {
      method: 'put',
      body: JSON.stringify(userInfo.serialize()),
    };

    return this.newCall([userInfo.owner, ''], extra);
  }

  delete(userInfo: UserInfo): Promise<{}> {
    const extra = {
      method: 'delete',
    };

    return this.newCall([userInfo.owner, ''], extra);
  }
}
