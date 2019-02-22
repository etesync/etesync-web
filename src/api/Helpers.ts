export type byte = number;
export type base64 = string;

export function stringToByteArray(str: string): byte[] {
  const ret = [];
  for (let i = 0 ; i < str.length ; i++) {
    ret.push(str.charCodeAt(i));
  }

  return ret;
}
