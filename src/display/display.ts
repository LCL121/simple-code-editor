import { Doc } from '../model/doc';
import { Input } from './input';
import { Cursor } from './cursor';
import { VNode } from '../shared/type';
import { posFromMouse } from '../model/pos';
import { createElement, createTextElement, isString, e_preventDefault, activeElt } from '../shared/utils';

interface DisplayInitOptions {
  container: HTMLElement;
  doc: Doc;
  input: Input;
  cursor: Cursor;
}

export class Display {
  static init(options: DisplayInitOptions) {
    const { doc, container, input, cursor } = options;
    if (doc.init) {
      const docEle = createVNodeElement(doc);
      container.append(input.ele, docEle);
      docEle.appendChild(cursor.ele);
      doc.init = false;

      Display.addEventListener(doc, input, cursor);
    } else {
      console.warn('doc initialized');
    }
  }

  private static addEventListener(doc: Doc, input: Input, cursor: Cursor) {
    doc.ele?.addEventListener('mousedown', (e) => {
      e_preventDefault(e);
      const pos = posFromMouse(doc, e);
      doc.updatePos(pos);
      if (activeElt() === document.body) {
        input.focus();
        cursor.show();
      }
      cursor.updatePosition(pos.position.x, pos.position.y);
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
  if (isString(children)) {
    ele.appendChild(createTextElement(children));
  } else if (children !== undefined) {
    for (const child of children) {
      ele.appendChild(createVNodeElement(child));
    }
  }
  node.ele = ele;
  return ele;
}
