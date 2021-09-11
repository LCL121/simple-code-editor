import SimpleCodeEditor from '../simpleCodeEditor';
import { Doc } from '../model/doc';
import { Change } from '../model/change';
import { Input } from './input';
import { Cursor } from './cursor';
import { VNode } from '../shared/type';
import { posFromMouse } from '../model/pos';
import { createElement, createTextElement, isString, e_preventDefault, activeElt, makeArray } from '../shared/utils';
import { KeyboardMapKeys, keyboardMapKeys, keyboardMap, inputTypes, InputTypes } from '../shared/constants';

export class Display {
  static init(editor: SimpleCodeEditor, container: HTMLElement) {
    const { doc, input, gutters, cursor, wrapper } = editor;
    if (doc.init) {
      const docEle = createVNodeElement(doc);
      wrapper.ele.append(input.ele, gutters.ele, docEle);
      docEle.appendChild(cursor.ele);
      container.appendChild(wrapper.ele);
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
    input.ele.addEventListener('blur', () => {
      cursor.hidden();
    });
    input.ele.addEventListener('focus', () => {
      cursor.show();
    });
    input.ele.addEventListener('input', (event) => {
      const e = event as InputEvent;
      const type = e.inputType as InputTypes;
      if (type === 'insertText') {
        if (e.data) {
          doc.updateDoc(
            new Change({
              from: doc.pos!,
              to: doc.pos!,
              origin: 'input',
              text: makeArray<string>(e.data)
            })
          );
        }
      }
      // doc.updateDoc();
    });
    input.ele.addEventListener('keydown', (e: KeyboardEvent) => {
      if (keyboardMapKeys.includes(e.key)) {
        e_preventDefault(e);
        const key = e.key as KeyboardMapKeys;
        if (key === 'Tab') {
          // doc.updateDoc()
        }
      }
    });
    input.ele.addEventListener('copy', (e) => {
      console.log(e);
    });
    input.ele.addEventListener('paste', (e) => {
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
