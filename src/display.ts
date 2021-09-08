import { Doc } from './doc';
import { VNode, VNodeAttrs } from './type';

export class Display {
  static render(doc: Doc, container: HTMLElement) {
    if (doc.init) {
      const children = createVNodeElement(doc);
      container.appendChild(children);
      doc.init = false;
    } else {
    }
  }
}

function createVNodeElement(node: VNode): HTMLElement {
  const ele = createElement(node.tag);
  const children = node.children;
  if (typeof children === 'string') {
    ele.appendChild(createTextElement(children));
  } else if (children !== undefined) {
    for (const child of children) {
      ele.appendChild(createVNodeElement(child));
    }
  }
  return ele;
}

function createElement(tag: string, attrs?: VNodeAttrs) {
  const ele = document.createElement(tag);
  if (attrs !== undefined) {
    for (const attr of attrs) {
      ele.setAttribute(attr.name, attr.value);
    }
  }
  return ele;
}

function createTextElement(text: string) {
  return document.createTextNode(text);
}
