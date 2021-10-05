import { shortcutMap, shortcutMapKeys } from '../constants';

export function isString(s: any): s is string {
  return typeof s === 'string';
}

export function isUndefined(u: any): u is undefined {
  return u === undefined;
}

export function isNumber(n: any): n is number {
  return typeof n === 'number';
}

export function isShortcutKeyName(s: any): s is keyof typeof shortcutMap {
  return shortcutMapKeys.includes(s);
}
