import * as sjcl from 'sjcl';

import * as Constants from './Constants';
import { byte, base64 } from './Helpers';

(sjcl as any).beware['CBC mode is dangerous because it doesn\'t protect message integrity.']();

sjcl.random.startCollectors();

export const HMAC_SIZE_BYTES = 32;

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

  encrypt(content: string): byte[] {
    const iv = sjcl.random.randomWords(this.cipherWords);

    let prp = new sjcl.cipher.aes(this.cipherKey);
    let cipherText = sjcl.mode.cbc.encrypt(prp, sjcl.codec.utf8String.toBits(content), iv);
    return sjcl.codec.bytes.fromBits(iv.concat(cipherText));
  }

  decrypt(content: byte[]): string {
    let cipherText = sjcl.codec.bytes.toBits(content);
    const iv = cipherText.splice(0, this.cipherWords);

    let prp = new sjcl.cipher.aes(this.cipherKey);
    let clearText = sjcl.mode.cbc.decrypt(prp, cipherText, iv);
    return sjcl.codec.utf8String.fromBits(clearText);
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
