export function swap<T>(a: T, b: T) {
  return [b, a];
}

export function splitTextByEnter(text: string) {
  return text.split(/\r\n?|\n/);
}

/**
 * @returns ctrl_alt_shift_meta_key
 */
export function getShortcutKeyName(e: KeyboardEvent) {
  let result = e.key;
  if (e.metaKey) {
    result = `meta_${result}`;
  }
  if (e.shiftKey) {
    result = `shift_${result}`;
  }
  if (e.altKey) {
    result = `alt_${result}`;
  }
  if (e.ctrlKey) {
    result = `ctrl_${result}`;
  }
  return result;
}
