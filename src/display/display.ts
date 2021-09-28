import SimpleCodeEditor from '../simpleCodeEditor';
import { Doc } from '../model/doc';
import { Change } from '../model/change';
import { Input } from './input';
import { Cursor } from './cursor';
import { Gutters } from './gutters';
import { Selected } from './selected';
import { PosSticky, VNode } from '../shared/type';
import { posFromMouse, Pos } from '../model/pos';
import { Selection } from '../model/selection';
import {
  createElement,
  createTextElement,
  isString,
  e_preventDefault,
  activeElt,
  makeArray,
  setClipboardContents,
  getClipboardContents,
  emitter,
  splitTextByEnter
} from '../shared/utils';
import { KeyboardMapKeys, keyboardMapKeys, InputTypes } from '../shared/constants';

interface EmitterEvents {
  update: any;
}

const emitterInstance = emitter<EmitterEvents>();

export function emitterEmitUpdate() {
  emitterInstance.emit('update');
}

export class Display {
  static init(editor: SimpleCodeEditor, container: HTMLElement) {
    const { doc, input, gutters, cursor, wrapper, selected } = editor;
    if (doc.init) {
      const docEle = createVNodeElement(doc);
      wrapper.ele.append(input.ele, gutters.ele, selected.ele, docEle);
      docEle.appendChild(cursor.ele);
      container.appendChild(wrapper.ele);
      doc.init = false;

      Display.addEventListener(doc, input, cursor, selected);

      emitterInstance.on('update', () => {
        Display.update(doc, cursor, gutters, selected);
      });
    } else {
      console.warn('doc initialized');
    }
  }

  private static update(doc: Doc, cursor: Cursor, gutters: Gutters, selected: Selected) {
    if (doc.mouseDown && doc.sel) {
      selected.update(doc.sel, doc.getDocRect()!.width);
    }
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
      doc.pos?.surmiseInfo(doc);
      cursor.updatePosition(doc.pos!.position.x, doc.pos!.position.y);
      if (doc.sel?.isValid()) {
        doc.sel.surmisePosInfo(doc);
        selected.update(doc.sel, doc.getDocRect()?.width!);
      }
    }
  }

  private static addEventListener(doc: Doc, input: Input, cursor: Cursor, selected: Selected) {
    doc.ele?.addEventListener('mousedown', (e) => {
      e_preventDefault(e);
      selected.hidden();
      doc.posMoveOver = false;
      doc.mouseDown = true;
      const pos = posFromMouse(doc, e);
      doc.updateSelection(new Selection(pos));
      doc.updatePos(pos);
      if (activeElt() === document.body) {
        input.focus();
        cursor.show();
      }
      cursor.updatePosition(pos.position.x, pos.position.y);
    });
    doc.ele?.addEventListener('mousemove', (e) => {
      requestAnimationFrame(() => {
        if (doc.mouseDown) {
          const pos = posFromMouse(doc, e);
          doc.sel?.updateEndPos(pos);
          doc.updatePos(pos);
          cursor.updatePosition(pos.position.x, pos.position.y);
          emitterEmitUpdate();
        }
      });
    });
    doc.ele?.addEventListener('mouseup', (e) => {
      doc.mouseDown = false;
      const pos = posFromMouse(doc, e);
      doc.sel?.updateEndPos(pos);
      doc.updatePos(pos);
      cursor.updatePosition(pos.position.x, pos.position.y);
      emitterEmitUpdate();
    });
    input.ele.addEventListener('blur', () => {
      cursor.hidden();
      selected.blur();
    });
    input.ele.addEventListener('focus', () => {
      cursor.show();
      selected.focus();
    });
    input.ele.addEventListener('input', (event) => {
      const e = event as InputEvent;
      const type = e.inputType as InputTypes;
      if (doc.posMoveOver) {
        doc.updatePos(doc.pos!.replace({ ch: doc.getLineLength(doc.pos!.line) - 1, sticky: 'after' }));
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
      keydownFn(e, doc, cursor, selected);
    });
    input.ele.addEventListener('copy', (e) => {
      e_preventDefault(e);
      setClipboardContents(doc.getSelectedCode());
    });
    input.ele.addEventListener('paste', async (e) => {
      e_preventDefault(e);
      const text = await getClipboardContents();
      if (text && doc.sel) {
        const { equal } = doc.sel.sort();
        /**
         * 解决enter 等改变pos，但不会改变selection 的操作，使sel 与pos 位置对应
         */
        doc.updateSelection(new Selection(doc.pos!));
        const { from, to } = doc.sel.sort();
        const texts = splitTextByEnter(text);
        if (equal && texts.length === 1) {
          doc.updatePos(from.replace({ ch: from.ch + texts[0].length }));
          doc.updateDoc(
            new Change({
              from,
              to,
              origin: 'input',
              text: makeArray<string>(texts)
            })
          );
        } else {
          if (!equal) {
            selected.hidden();
          }
          doc.updateDoc({
            from,
            to,
            origin: 'paste',
            text: makeArray<string>(texts)
          });
          const newPos = new Pos({
            line: from.line + texts.length - 1,
            ch: texts[texts.length - 1].length,
            sticky: 'before'
          });
          doc.updatePos(newPos);
          doc.updateSelection(new Selection(newPos));
        }
      }
    });
    input.ele.addEventListener('cut', (e) => {
      e_preventDefault(e);
      if (doc.sel) {
        const text = doc.getSelectedCode();
        setClipboardContents(text);
        const { from, to } = doc.sel.sort();
        doc.updateDoc(
          new Change({
            from,
            to,
            origin: 'cut',
            text: [text]
          })
        );
        selected.hidden();
        doc.updatePos(from);
        doc.updateSelection(new Selection(from));
      }
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

function keydownFn(e: KeyboardEvent, doc: Doc, cursor: Cursor, selected: Selected) {
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
          const chIdxLeft = pos.getPosChBySticky();
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
          const chIdxRight = pos.getPosChBySticky();
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
        case 'Backspace': {
          if (doc.sel?.isValid()) {
            const { from, to } = doc.sel.sort();
            doc.updateDoc(
              new Change({
                from,
                to,
                origin: '-delete',
                text: []
              })
            );
            selected.hidden();
            doc.updatePos(from);
            doc.updateSelection(new Selection(from));
          } else {
            if (doc.posMoveOver) {
              doc.updatePos(pos!.replace({ ch: doc.getLineLength(pos!.line) - 1, sticky: 'after' }));
              doc.posMoveOver = false;
            }
            const currentPosBackSpace = doc.pos!;
            const chIdxBackSpace = currentPosBackSpace.getPosChBySticky();
            if (chIdxBackSpace === 0) {
              if (currentPosBackSpace.line === 0) {
                return;
              } else {
                doc.updatePos(
                  new Pos({
                    line: currentPosBackSpace.line - 1,
                    ch: doc.getLineLength(currentPosBackSpace.line - 1) - 1,
                    sticky: 'after'
                  })
                );
              }
            } else {
              doc.updatePos(currentPosBackSpace!.replace({ ch: currentPosBackSpace!.ch - 1 }));
            }
            doc.updateDoc(
              new Change({
                from: currentPosBackSpace!,
                to: currentPosBackSpace!,
                origin: '-delete',
                text: []
              })
            );
          }
          return;
        }
        case 'Delete': {
          if (doc.sel?.isValid()) {
            const { from, to } = doc.sel.sort();
            doc.updateDoc(
              new Change({
                from,
                to,
                origin: 'delete-',
                text: []
              })
            );
            selected.hidden();
            doc.updatePos(from);
            doc.updateSelection(new Selection(from));
          } else {
            if (doc.posMoveOver) {
              doc.updatePos(pos!.replace({ ch: doc.getLineLength(pos!.line) - 1, sticky: 'after' }));
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
          }
          return;
        }
        case 'Enter': {
          if (doc.sel?.isValid()) {
            const { from, to } = doc.sel.sort();
            doc.updateDoc(
              new Change({
                from,
                to,
                origin: 'enter',
                text: []
              })
            );
            selected.hidden();
            doc.updatePos(
              new Pos({
                line: from.line + 1,
                ch: 0,
                sticky: 'before'
              })
            );
            doc.updateSelection(new Selection(from));
          } else {
            if (doc.posMoveOver) {
              doc.updatePos(pos!.replace({ ch: doc.getLineLength(pos!.line) - 1, sticky: 'after' }));
              doc.posMoveOver = false;
            }
            const currentPosEnter = doc.pos!;
            doc.updatePos(
              new Pos({
                line: currentPosEnter.line + 1,
                ch: 0,
                sticky: 'before'
              })
            );
            doc.updateDoc(
              new Change({
                from: currentPosEnter!,
                to: currentPosEnter!,
                origin: 'enter',
                text: []
              })
            );
          }
          return;
        }
        case 'Tab': {
          if (doc.sel?.isValid()) {
            const { from, to } = doc.sel.sort();
            doc.updateDoc(
              new Change({
                from,
                to,
                origin: 'tab',
                text: []
              })
            );
            const { startPos, endPos } = doc.sel;
            const newStartPos = startPos.replace({ ch: startPos.ch + 2 });
            const newEndPos = endPos.replace({ ch: endPos.ch + 2 });
            const newSel = new Selection(newStartPos, newEndPos);
            doc.updatePos(newEndPos);
            doc.updateSelection(newSel);
            selected.update(newSel, doc.getDocRect()?.width!);
          } else {
            if (doc.posMoveOver) {
              doc.updatePos(pos!.replace({ ch: doc.getLineLength(pos!.line) - 1, sticky: 'after' }));
              doc.posMoveOver = false;
            }
            const currentPosTab = doc.pos!;
            doc.updatePos(currentPosTab!.replace({ ch: currentPosTab!.ch + 2 }));
            doc.updateDoc(
              new Change({
                from: currentPosTab!,
                to: currentPosTab!,
                origin: 'tab',
                text: []
              })
            );
          }
          return;
        }
      }
      /*
       * 移动光标 处理
       * 其他effect 在Display.update 处理
       */
      newPos.surmiseInfo(doc);
      doc.updatePos(newPos);
      cursor.updatePosition(newPos!.position.x, newPos!.position.y);
    }
  }
}
