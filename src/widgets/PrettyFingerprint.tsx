import * as React from 'react';
import sjcl from 'sjcl';

import { byte, base64 } from 'etesync';

function byteArray4ToNumber(bytes: byte[], offset: number) {
  // tslint:disable:no-bitwise
  return (
    ((bytes[offset + 0] & 0xff) * (1 << 24)) +
    ((bytes[offset + 1] & 0xff) * (1 << 16)) +
    ((bytes[offset + 2] & 0xff) * (1 << 8)) +
    ((bytes[offset + 3] & 0xff))
  );
}

function getEncodedChunk(publicKey: byte[], offset: number) {
  const chunk = byteArray4ToNumber(publicKey, offset) % 100000;
  return chunk.toString().padStart(5, '0');
}

interface PropsType {
  publicKey: base64;
}

class PrettyFingerprint extends React.PureComponent<PropsType> {
  public render() {
    const fingerprint = sjcl.codec.bytes.fromBits(
      sjcl.hash.sha256.hash(sjcl.codec.base64.toBits(this.props.publicKey))
    );

    const spacing = '   ';
    const prettyPublicKey =
      getEncodedChunk(fingerprint, 0) + spacing +
      getEncodedChunk(fingerprint, 4) + spacing +
      getEncodedChunk(fingerprint, 8) + spacing +
      getEncodedChunk(fingerprint, 12) + '\n' +
      getEncodedChunk(fingerprint, 16) + spacing +
      getEncodedChunk(fingerprint, 20) + spacing +
      getEncodedChunk(fingerprint, 24) + spacing +
      getEncodedChunk(fingerprint, 28);

    return (
      <pre>{prettyPublicKey}</pre>
    );
  }
}

export default PrettyFingerprint;
