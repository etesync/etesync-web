import * as sjcl from 'sjcl';
import * as NodeRSA from 'node-rsa';

import * as Constants from './Constants';
import { byte, base64 } from './Helpers';

(sjcl as any).beware['CBC mode is dangerous because it doesn\'t protect message integrity.']();

sjcl.random.startCollectors();

export const HMAC_SIZE_BYTES = 32;

export class AsymmetricKeyPair {
  publicKey: byte[];
  privateKey: byte[];

  constructor(publicKey: byte[], privateKey: byte[]) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }
}

export function deriveKey(salt: string, password: string): string {
  const keySize = 190 * 8;

  return sjcl.codec.base64.fromBits((sjcl.misc as any).scrypt(password, salt, 16384, 8, 1, keySize));
}

function hmac256(salt: sjcl.BitArray, key: sjcl.BitArray) {
  let hmac = new sjcl.misc.hmac(salt);
  return hmac.encrypt(key);
}

export class CryptoManager {
  version: number;
  key: sjcl.BitArray;
  cipherKey: sjcl.BitArray;
  hmacKey: sjcl.BitArray;

  cipherWords = 4;

  static fromDerivedKey(key: byte[], version: number = Constants.CURRENT_VERSION) {
    // FIXME: Cleanup this hack
    const ret = new CryptoManager('', '', version);
    ret.key = sjcl.codec.bytes.toBits(key);
    ret._updateDerivedKeys();
    return ret;
  }

  constructor(_keyBase64: base64, salt: string, version: number = Constants.CURRENT_VERSION) {
    this.version = version;
    let key = sjcl.codec.base64.toBits(_keyBase64);
    // FIXME: Clean up all exeptions
    if (version > Constants.CURRENT_VERSION) {
      throw new Error('VersionTooNewException');
    } else if (version === 1) {
      this.key = key;
    } else {
      this.key = hmac256(sjcl.codec.utf8String.toBits(salt), key);
    }

    this._updateDerivedKeys();
  }

  _updateDerivedKeys() {
    this.cipherKey = hmac256(sjcl.codec.utf8String.toBits('aes'), this.key);
    this.hmacKey = hmac256(sjcl.codec.utf8String.toBits('hmac'), this.key);
  }

  encryptBits(content: sjcl.BitArray): byte[] {
    const iv = sjcl.random.randomWords(this.cipherWords);

    let prp = new sjcl.cipher.aes(this.cipherKey);
    let cipherText = sjcl.mode.cbc.encrypt(prp, content, iv);
    return sjcl.codec.bytes.fromBits(iv.concat(cipherText));
  }

  decryptBits(content: byte[]): sjcl.BitArray {
    let cipherText = sjcl.codec.bytes.toBits(content);
    const iv = cipherText.splice(0, this.cipherWords);

    let prp = new sjcl.cipher.aes(this.cipherKey);
    let clearText = sjcl.mode.cbc.decrypt(prp, cipherText, iv);
    return clearText;
  }

  encryptBytes(content: byte[]): byte[] {
    return this.encryptBits(sjcl.codec.bytes.toBits(content));
  }

  decryptBytes(content: byte[]): byte[] {
    return sjcl.codec.bytes.fromBits(this.decryptBits(content));
  }

  encrypt(content: string): byte[] {
    return this.encryptBits(sjcl.codec.utf8String.toBits(content));
  }

  decrypt(content: byte[]): string {
    return sjcl.codec.utf8String.fromBits(this.decryptBits(content));
  }

  hmac(content: byte[]): byte[] {
    return sjcl.codec.bytes.fromBits(this.hmacBase(content));
  }

  hmac64(content: byte[]): base64 {
    return sjcl.codec.base64.fromBits(this.hmacBase(content));
  }

  hmacHex(content: byte[]): string {
    return sjcl.codec.hex.fromBits(this.hmacBase(content));
  }

  private hmacBase(_content: byte[]): sjcl.BitArray {
    let content;
    if (this.version === 1) {
      content = sjcl.codec.bytes.toBits(_content);
    } else {
      content = sjcl.codec.bytes.toBits(_content.concat([this.version]));
    }

    return hmac256(this.hmacKey, content);
  }
}

function bufferToArray(buffer: Buffer) {
  return Array.prototype.slice.call(buffer);
}

export class AsymmetricCryptoManager {
  keyPair: NodeRSA;

  static generateKeyPair() {
    const keyPair = new NodeRSA();
    keyPair.generateKeyPair(3072, 65537);
    const pubkey = keyPair.exportKey('pkcs1-public-der') as Buffer;
    const privkey = keyPair.exportKey('pkcs1-private-der') as Buffer;
    return new AsymmetricKeyPair(
      bufferToArray(pubkey), bufferToArray(privkey));
  }

  constructor(keyPair: AsymmetricKeyPair) {
    this.keyPair = new NodeRSA();
    this.keyPair.importKey(Buffer.from(keyPair.privateKey), 'pkcs1-der');
  }

  encryptBytes(publicKey: byte[], content: byte[]): byte[] {
    const key = new NodeRSA();
    key.importKey(Buffer.from(publicKey), 'pkcs1-public-der');
    return bufferToArray(key.encrypt(Buffer.from(content), 'buffer'));
  }

  decryptBytes(content: byte[]): byte[] {
    return bufferToArray(this.keyPair.decrypt(Buffer.from(content), 'buffer'));
  }
}
