export function findAndReplace<T>(arr: T[], target: T, matcher: (a: T, b: number) => boolean): [T[], T | null, number] {
  const replaceIndex = arr.findIndex(matcher);

  if (replaceIndex === -1) {
    return [arr, null, replaceIndex];
  }

  const ret = [...arr];
  const out = arr[replaceIndex];
  ret[replaceIndex] = target;

  return [ret, out, replaceIndex];
}

export function makeArray<T>(val: T[] | T): T[] {
  return val instanceof Array ? val : [val];
}

export function exactEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
