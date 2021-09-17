import SimpleCodeEditor from '../simpleCodeEditor';
import { Doc } from '../model/doc';
import { Change } from '../model/change';
import { Input } from './input';
import { Cursor } from './cursor';
import { Gutters } from './gutters';
import { PosSticky, VNode } from '../shared/type';
import { posFromMouse, surmiseInfoFromPos, judgeChBySticky, Pos } from '../model/pos';
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

      requestAnimationFrame(() => {
        Display.update(doc, cursor, gutters);
      });
    } else {
      console.warn('doc initialized');
    }
  }

  private static update(doc: Doc, cursor: Cursor, gutters: Gutters) {
    let update = false;
    while (doc.effect.length() > 0) {
      const line = doc.effect.shift();
      if (line) {
        if (line.effectTag === 'update') {
          line.ele!.innerText = line.text;
        } else if (line.effectTag === 'delete') {
          line.ele!.remove();
          doc.removeLine(line);
          gutters.updateGutters(doc.getLinesNum());
        } else if (line.effectTag === 'add') {
          line.ele = createVNodeElement(line);
          line.parent?.ele?.insertBefore(line.ele, line.nextSibling?.ele!);
          gutters.updateGutters(doc.getLinesNum());
        }
        line.effectTag = undefined;
        update = true;
      }
    }
    if (update) {
      surmiseInfoFromPos(doc.pos!, doc);
      cursor.updatePosition(doc.pos!.position.x, doc.pos!.position.y);
    }
    requestAnimationFrame(() => {
      Display.update(doc, cursor, gutters);
    });
  }

  private static addEventListener(doc: Doc, input: Input, cursor: Cursor) {
    doc.ele?.addEventListener('mousedown', (e) => {
      e_preventDefault(e);
      doc.posMoveOver = false;
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
      if (doc.posMoveOver) {
        doc.updatePos(doc.pos!.replace({ ch: doc.getLine(doc.pos!.line).text.length - 1, sticky: 'after' }));
        doc.posMoveOver = false;
      }
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
          doc.updatePos(doc.pos!.replace({ ch: doc.pos!.ch + 1 }));
        }
      }
    });
    input.ele.addEventListener('keydown', (e: KeyboardEvent) => {
      keydownFn(e, doc, cursor);
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

function keydownFn(e: KeyboardEvent, doc: Doc, cursor: Cursor) {
  if (keyboardMapKeys.includes(e.key)) {
    e_preventDefault(e);
    const key = e.key as KeyboardMapKeys;
    const pos = doc.pos;
    if (pos) {
      let newPos: Pos;
      switch (key) {
        case 'ArrowUp':
          doc.posMoveOver = false;
          newPos = pos.replace({ line: pos.line === 0 ? 0 : pos.line - 1 });
          break;
        case 'ArrowDown':
          doc.posMoveOver = false;
          newPos = pos.replace({ line: pos.line === doc.getMaxLineN() ? pos.line : pos.line + 1 });
          break;
        case 'ArrowLeft':
          doc.posMoveOver = false;
          const chIdxLeft = judgeChBySticky(pos.ch, pos.sticky);
          let newChLeft: number;
          let newLineLeft: number;
          let newStickyLeft: PosSticky;
          if (chIdxLeft === 0) {
            if (pos.line === 0) {
              return;
            } else {
              newLineLeft = pos.line - 1;
              newChLeft = doc.getLine(newLineLeft).text.length - 1;
              newStickyLeft = 'after';
            }
          } else {
            newLineLeft = pos.line;
            newChLeft = chIdxLeft - 1;
            newStickyLeft = 'before';
          }
          newPos = new Pos({
            line: newLineLeft,
            ch: newChLeft,
            sticky: newStickyLeft
          });
          break;
        case 'ArrowRight':
          doc.posMoveOver = false;
          const chIdxRight = judgeChBySticky(pos.ch, pos.sticky);
          let newChRight: number;
          let newLineRight: number;
          let newStickyRight: PosSticky;
          if (doc.getLine(pos.line).text.length === chIdxRight) {
            if (pos.line === doc.getMaxLineN()) {
              return;
            } else {
              newLineRight = pos.line + 1;
              newChRight = 0;
              newStickyRight = 'before';
            }
          } else {
            newChRight = chIdxRight + 1;
            newLineRight = pos.line;
            newStickyRight = 'before';
          }
          newPos = new Pos({
            line: newLineRight,
            ch: newChRight,
            sticky: newStickyRight
          });
          break;
        case 'Home':
          doc.posMoveOver = false;
          newPos = pos.replace({ ch: 0, sticky: 'before' });
          break;
        case 'End':
          doc.posMoveOver = false;
          newPos = pos.replace({ ch: doc.getLine(pos.line).text.length - 1, sticky: 'after' });
          break;
        case 'Backspace':
          if (doc.posMoveOver) {
            doc.updatePos(doc.pos!.replace({ ch: doc.getLine(doc.pos!.line).text.length - 1, sticky: 'after' }));
            doc.posMoveOver = false;
          }
          doc.updateDoc(
            new Change({
              from: doc.pos!,
              to: doc.pos!,
              origin: '-delete',
              text: []
            })
          );
          const chIdxBackSpace = judgeChBySticky(pos.ch, pos.sticky);
          if (chIdxBackSpace === 0) {
            if (pos.line === 0) {
              return;
            } else {
              doc.updatePos(
                new Pos({
                  line: pos.line - 1,
                  ch: doc.getLine(pos.line - 1).text.length - 1,
                  sticky: 'after'
                })
              );
            }
          } else {
            doc.updatePos(doc.pos!.replace({ ch: doc.pos!.ch - 1 }));
          }
          return;
        case 'Delete':
          if (doc.posMoveOver) {
            doc.updatePos(doc.pos!.replace({ ch: doc.getLine(doc.pos!.line).text.length - 1, sticky: 'after' }));
            doc.posMoveOver = false;
          }
          doc.updateDoc(
            new Change({
              from: doc.pos!,
              to: doc.pos!,
              origin: 'delete-',
              text: []
            })
          );
          return;
        case 'Enter':
          if (doc.posMoveOver) {
            doc.updatePos(doc.pos!.replace({ ch: doc.getLine(doc.pos!.line).text.length - 1, sticky: 'after' }));
            doc.posMoveOver = false;
          }
          doc.updateDoc(
            new Change({
              from: doc.pos!,
              to: doc.pos!,
              origin: 'enter',
              text: []
            })
          );
          doc.updatePos(
            new Pos({
              line: pos.line + 1,
              ch: 0,
              sticky: 'before'
            })
          );
          return;
        case 'Tab':
          doc.updateDoc(
            new Change({
              from: doc.pos!,
              to: doc.pos!,
              origin: 'input',
              text: ['  ']
            })
          );
          doc.updatePos(doc.pos!.replace({ ch: doc.pos!.ch + 2 }));
          return;
      }
      surmiseInfoFromPos(newPos!, doc);
      doc.updatePos(newPos!);
      cursor.updatePosition(newPos!.position.x, newPos!.position.y);
    }
  }
}
