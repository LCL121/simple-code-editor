export function range(node: Text, start: number, end: number, endNode?: Text) {
  const r = document.createRange();
  r.setEnd(endNode || node, end);
  r.setStart(node, start);
  return r;
}
