export function swap<T>(a: T, b: T) {
  return [b, a];
}

export function splitTextByEnter(text: string) {
  return text.split(/\r\n?|\n/);
}
