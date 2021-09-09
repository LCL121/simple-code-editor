import { Doc } from './doc';
import { Input } from './input';
import { VNode, VNodeAttrs } from './type';

interface DisplayInitOptions {
  container: HTMLElement;
  doc: Doc;
  input: Input;
}

export class Display {
  static init(options: DisplayInitOptions) {
    const { doc, container, input } = options;
    if (doc.init) {
      const children = createVNodeElement(doc);
      container.append(input.ele, children);
      doc.init = false;

      Display.addEventListener(doc, input);
    } else {
      console.warn('doc initialized');
    }
  }

  private static addEventListener(doc: Doc, input: Input) {
    doc.ele?.addEventListener('click', () => {
      input.focus();
    });
    input.ele.addEventListener('input', (e) => {
      console.log(e);
      doc.updateDoc();
    });
    input.ele.addEventListener('copy', (e) => {
      console.log(e);
    });
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
