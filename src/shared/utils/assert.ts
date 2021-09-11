export function isString(s: any): s is string {
  return typeof s === 'string';
}

export function isUndefined(u: any): u is undefined {
  return u === undefined;
}
