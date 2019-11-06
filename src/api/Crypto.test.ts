import { CryptoManager, AsymmetricCryptoManager, deriveKey } from './Crypto';
import { USER, PASSWORD, keyBase64 } from './TestConstants';

import { stringToByteArray } from './Helpers';

import sjcl from 'sjcl';
sjcl.random.addEntropy('seedForTheTests', 1024, 'FakeSeed');

it('Derive key', () => {
  const derived = deriveKey(USER, PASSWORD);
  expect(derived).toBe(keyBase64);
});

it('Symmetric encryption v1', () => {
  const cryptoManager = new CryptoManager(keyBase64, 'TestSaltShouldBeJournalId', 1);
  const clearText = 'This Is Some Test Cleartext.';
  const cipher = cryptoManager.encrypt(clearText);
  expect(clearText).toBe(cryptoManager.decrypt(cipher));

  const expected = 'Lz+HUFzh1HdjxuGdQrBwBG1IzHT0ug6mO8fwePSbXtc=';
  expect(expected).toBe(cryptoManager.hmac64(stringToByteArray('Some test data')));
});

it('Symmetric encryption v2', () => {
  const cryptoManager = new CryptoManager(keyBase64, 'TestSaltShouldBeJournalId', 2);
  const clearText = 'This Is Some Test Cleartext.';
  const cipher = cryptoManager.encrypt(clearText);
  expect(clearText).toBe(cryptoManager.decrypt(cipher));

  const expected = 'XQ/A0gentOaE98R9wzf3zEIAHj4OH1GF8J4C6JiJupo=';
  expect(expected).toBe(cryptoManager.hmac64(stringToByteArray('Some test data')));
});

it('Asymmetric encryption', () => {
  const keyPair = AsymmetricCryptoManager.generateKeyPair();
  const cryptoManager = new AsymmetricCryptoManager(keyPair);

  const clearText = [1, 2, 4, 5];
  const cipher = cryptoManager.encryptBytes(keyPair.publicKey, clearText);
  expect(clearText).toEqual(cryptoManager.decryptBytes(cipher));
});
