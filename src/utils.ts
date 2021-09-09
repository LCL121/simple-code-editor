import { VNodeAttrs } from './type';

export function range(node: Text, start: number, end: number, endNode?: Text) {
  const r = document.createRange();
  r.setEnd(endNode || node, end);
  r.setStart(node, start);
  return r;
}

export function createElement(tag: string, attrs?: VNodeAttrs) {
  const ele = document.createElement(tag);
  if (attrs !== undefined) {
    for (const attr of attrs) {
      ele.setAttribute(attr.name, attr.value);
    }
  }
  return ele;
}

export function createTextElement(text: string) {
  return document.createTextNode(text);
}
