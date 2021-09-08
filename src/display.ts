import { Doc } from './doc';
import { Input } from './input';
import { VNode, VNodeAttrs } from './type';

interface DisplayRenderOptions {
  container: HTMLElement;
  doc: Doc;
  input?: Input;
}

export class Display {
  static render(options: DisplayRenderOptions) {
    const { doc, container, input } = options;
    if (doc.init) {
      const children = createVNodeElement(doc);
      container.appendChild(children);
      input?.init(container, doc);
      doc.init = false;
    } else {
    }
  }
}

function createVNodeElement(node: VNode): HTMLElement {
  const ele = createElement(node.tag, node.attrs);
  const children = node.children;
  if (typeof children === 'string') {
    ele.appendChild(createTextElement(children));
  } else if (children !== undefined) {
    for (const child of children) {
      ele.appendChild(createVNodeElement(child));
    }
  }
  node.ele = ele;
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
