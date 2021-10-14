import { VNodeAttrs } from '../type';

export function createElement(tag: string, attrs: VNodeAttrs) {
  const ele = document.createElement(tag);
  for (const attr of attrs) {
    ele.setAttribute(attr.name, attr.value);
  }
  return ele;
}

export function createTextElement(text: string) {
  return document.createTextNode(text);
}

export function activeElt() {
  // IE and Edge may throw an "Unspecified Error" when accessing document.activeElement.
  // IE < 10 will throw when accessed while the page is loading or in an iframe.
  // IE > 9 and Edge will throw when accessed in an iframe if document.body is unavailable.
  let activeElement: Element | null;
  try {
    activeElement = document.activeElement;
  } catch (e) {
    activeElement = document.body || null;
  }
  while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement;
  }
  return activeElement;
}
