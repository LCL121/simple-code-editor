import SimpleCodeEditor from '../simpleCodeEditor';
import { Doc } from '../model/doc';
import { Change } from '../model/change';
import { Cursor } from './cursor';
import { Gutters } from './gutters';
import { Selected } from './selected';
import { PosSticky, VNode } from '../shared/type';
import { posFromMouse, Pos, isPos } from '../model/pos';
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
  splitTextByEnter,
  getShortcutKeyName,
  isShortcutKeyName
} from '../shared/utils';
import { KeyboardMapKeys, keyboardMapKeys, InputTypes, shortcutMap } from '../shared/constants';

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

      Display._addEventListener(editor);

      emitterInstance.on('update', () => {
        Display._update(editor);
      });

      doc.updateDocRect();

      editor.mounted?.();
    } else {
      console.warn('doc initialized');
    }
  }

  private static _update(editor: SimpleCodeEditor) {
    const { doc, cursor, gutters, selected } = editor;

    // 处理selected 展示
    if (doc.mouseDown && doc.sel) {
      selected.update(doc.sel);
    } else if (!doc.sel?.isValid() && !selected.isHidden) {
      selected.hidden();
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
          // insertBefore 若next 为空，会将指定的节点添加到指定父节点的子节点列表的末尾
          line.parent?.ele?.insertBefore(line.ele, line.nextSibling?.ele!);
          gutters.updateGutters(doc.getLinesNum());
        }
        line.effectTag = undefined;
        update = true;
      }
    }

    // 处理光标以及selected 展示
    if (update) {
      doc.pos?.surmiseInfo(doc);
      cursor.updatePosition(doc.pos!);
      if (doc.sel?.isValid()) {
        doc.sel.surmisePosInfo(doc);
        selected.update(doc.sel);
      }
    }
  }

  private static _addEventListener(editor: SimpleCodeEditor) {
    const { doc, input, cursor, selected } = editor;

    // doc 监听事件
    doc.ele?.addEventListener('mousedown', (e) => {
      e_preventDefault(e);
      doc.posMoveOver = false;
      doc.mouseDown = true;
      const pos = posFromMouse(e, doc, editor);
      if (!doc.sel?.isInclude(pos)) {
        selected.hidden();
        doc.updatePos(pos);
        doc.updateSelection(new Selection(pos));
        if (activeElt() === document.body) {
          input.focus();
          cursor.show();
        }
        cursor.updatePosition(pos);
      } else {
        doc.updatePos(pos);
        doc.isDrag = true;
      }
    });
    doc.ele?.addEventListener('mousemove', (e) => {
      if (doc.mouseDown) {
        if (doc.isDrag) {
          // TODO
        } else {
          requestAnimationFrame(() => {
            const pos = posFromMouse(e, doc, editor);
            doc.sel?.updateEndPos(pos);
            doc.updatePos(pos);
            cursor.updatePosition(pos);
            emitterEmitUpdate();
          });
        }
      }
    });
    doc.ele?.addEventListener('mouseup', (e) => {
      const pos = posFromMouse(e, doc, editor);
      if (doc.isDrag) {
        if (doc.pos && pos.cmp(doc.pos) === 0) {
          doc.updatePos(pos);
          doc.updateSelection(new Selection(pos));
          cursor.updatePosition(pos);
          emitterEmitUpdate();
        }
      } else {
        doc.sel?.updateEndPos(pos);
        doc.updatePos(pos);
        cursor.updatePosition(pos);
        emitterEmitUpdate();
      }
      doc.isDrag = false;
      doc.mouseDown = false;
    });

    // input 监听事件
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
      if (doc.isComposing) {
        // 排除composition 使其只通过composition 事件触发
        return;
      }
      const type = e.inputType as InputTypes;
      if (doc.posMoveOver) {
        doc.updatePos(doc.pos!.replace({ ch: doc.getLineLength(doc.pos!.line) - 1, sticky: 'after' }));
        doc.posMoveOver = false;
      }
      if (type === 'insertText') {
        const text = e.data;
        if (text && doc.pos) {
          if (doc.sel?.isValid()) {
            const { from, to } = doc.sel.sort();
            doc.updateDoc(
              new Change({
                from,
                to,
                origin: 'input',
                text: makeArray(text),
                removed: makeArray(doc.getSelectedCode())
              })
            );
            const newPos = from.replace({ ch: from.ch + 1 });
            doc.updatePos(newPos);
            doc.updateSelection(new Selection(newPos));
            selected.hidden();
          } else {
            doc.updateDoc(
              new Change({
                from: doc.pos,
                // 为兼容composition input 最后data 长度大于1
                to: doc.pos.replace({ ch: doc.pos.ch + text.length - 1 }),
                origin: 'input',
                text: makeArray(text)
              })
            );
            doc.updatePos(doc.pos.replace({ ch: doc.pos.ch + text.length }));
          }
        }
      } else if (type === 'deleteContentBackward') {
        // 处理composition input 兼容
        if (isPos(doc.compositionStartPos)) {
          doc.updateDoc(
            new Change({
              from: doc.compositionStartPos,
              to: doc.compositionStartPos.replace({ ch: doc.compositionStartPos.ch + doc.compositionText.length }),
              origin: '-delete',
              removed: makeArray(doc.compositionText),
              text: []
            })
          );
          doc.updatePos(doc.compositionStartPos);
          input.updatePosition(doc.compositionStartPos);
        }
      }
      if (isPos(doc.compositionStartPos)) {
        // 处理composition input 兼容
        doc.compositionStartPos = undefined;
        doc.compositionText = '';
      }
    });
    input.ele.addEventListener('compositionstart', (e) => {
      e_preventDefault(e);
      if (doc.sel?.isValid()) {
        const { from, to } = doc.sel.sort();
        doc.updateDoc(
          new Change({
            from,
            to,
            origin: '-delete',
            removed: makeArray(doc.getSelectedCode()),
            text: []
          })
        );
        doc.updatePos(from);
        doc.updateSelection(new Selection(from));
        selected.hidden();
      }
      doc.compositionStartPos = doc.pos;
      doc.compositionText = '';
      doc.isComposing = true;
    });
    input.ele.addEventListener('compositionupdate', (e) => {
      e_preventDefault(e);
      const text = e.data;
      if (text) {
        if (doc.compositionText !== text && isPos(doc.compositionStartPos)) {
          doc.updateDoc(
            new Change({
              from: doc.compositionStartPos,
              to: doc.compositionStartPos.replace({ ch: doc.compositionStartPos.ch + doc.compositionText.length }),
              origin: 'compose',
              text: makeArray<string>(text)
            })
          );
          const newPos = doc.pos!.replace({ ch: doc.compositionStartPos.ch + text.length });
          doc.updatePos(newPos);
          input.updatePosition(newPos);
          doc.compositionText = text;
        }
      }
    });
    input.ele.addEventListener('compositionend', (e) => {
      e_preventDefault(e);
      doc.isComposing = false;
    });
    input.ele.addEventListener('keydown', (e: KeyboardEvent) => {
      keydownFn(e, editor);
    });
    input.ele.addEventListener('copy', (e) => {
      e_preventDefault(e);
      if (doc.sel?.isValid()) {
        setClipboardContents(doc.getSelectedCode());
      } else if (doc.pos) {
        setClipboardContents(`${doc.getLineText(doc.pos.line)}\n`);
      }
    });
    input.ele.addEventListener('paste', async (e) => {
      e_preventDefault(e);
      const text = await getClipboardContents();
      if (text) {
        const texts = splitTextByEnter(text);
        if (doc.sel?.isValid()) {
          const { from, to } = doc.sel.sort();
          doc.updateDoc(
            new Change({
              from,
              to,
              origin: 'paste',
              removed: makeArray(doc.getSelectedCode()),
              text: makeArray<string>(texts)
            })
          );
          let newPos: Pos;
          if (texts.length === 1) {
            newPos = new Pos({
              line: from.line,
              ch: from.getPosChBySticky() + texts[0].length,
              sticky: 'before'
            });
          } else {
            newPos = new Pos({
              line: from.line + texts.length - 1,
              ch: texts[texts.length - 1].length,
              sticky: 'before'
            });
          }
          selected.hidden();
          doc.updatePos(newPos);
          doc.updateSelection(new Selection(newPos));
        } else {
          const pos = doc.pos!;
          if (texts.length === 1) {
            doc.updatePos(pos.replace({ ch: pos.ch + texts[0].length }));
            doc.updateDoc(
              new Change({
                from: pos,
                to: pos,
                origin: 'paste',
                text: makeArray<string>(texts)
              })
            );
          } else {
            doc.updateDoc(
              new Change({
                from: pos,
                to: pos,
                origin: 'paste',
                text: makeArray<string>(texts)
              })
            );
            const newPos = new Pos({
              line: pos.line + texts.length - 1,
              ch: texts[texts.length - 1].length,
              sticky: 'before'
            });
            doc.updatePos(newPos);
            doc.updateSelection(new Selection(newPos));
          }
        }
      }
    });
    input.ele.addEventListener('cut', (e) => {
      e_preventDefault(e);
      if (doc.sel?.isValid()) {
        const text = doc.getSelectedCode();
        setClipboardContents(text);
        const { from, to } = doc.sel.sort();
        doc.updateDoc(
          new Change({
            from,
            to,
            origin: 'cut',
            removed: makeArray(text),
            text: []
          })
        );
        selected.hidden();
        doc.updatePos(from);
        doc.updateSelection(new Selection(from));
      } else if (doc.pos) {
        const text = `${doc.getLineText(doc.pos.line)}\n`;
        setClipboardContents(text);
        doc.updateDoc(
          new Change({
            from: doc.pos,
            to: doc.pos,
            origin: 'cut',
            removed: [text],
            text: []
          })
        );
        const newPos = new Pos({ line: doc.pos.line, ch: 0, sticky: 'before' });
        doc.updatePos(newPos);
        doc.updateSelection(new Selection(newPos));
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

function keydownFn(e: KeyboardEvent, editor: SimpleCodeEditor) {
  const { doc, cursor, selected } = editor;

  // 快捷键处理
  const shortcutKeyName = getShortcutKeyName(e);
  if (isShortcutKeyName(shortcutKeyName)) {
    e_preventDefault(e);
    const shortcutValue = shortcutMap[shortcutKeyName];
    if (shortcutValue === 'selectedAll') {
      const fromPos = new Pos({ line: 0, ch: 0, sticky: 'before' });
      const toPos = new Pos({ line: doc.getMaxLineN(), ch: doc.getLastLine().text.length, sticky: 'before' });
      fromPos.surmiseInfo(doc);
      toPos.surmiseInfo(doc);
      const newSelection = new Selection(fromPos, toPos);

      doc.updatePos(toPos);
      cursor.updatePosition(toPos);
      doc.updateSelection(newSelection);
      selected.update(newSelection);
    } else if (shortcutValue === 'undo') {
      if (doc.pos) {
        doc.updateDoc(new Change({ origin: 'undo', from: doc.pos, to: doc.pos, text: [] }));
      }
    } else if (shortcutValue === 'redo') {
      if (doc.pos) {
        doc.updateDoc(new Change({ origin: 'redo', from: doc.pos, to: doc.pos, text: [] }));
      }
    } else if (shortcutValue === 'reTab') {
      if (doc.pos) {
        const pos = doc.pos;
        const lineN = pos.line;
        if (doc.sel?.isValid()) {
          const { from, to } = doc.sel.sort();
          const fromLineN = from.line;
          const toLineN = to.line;
          const removed: string[] = [];
          let posLineStartWith = '';
          let fromLineStartWith = '';
          let toLineStartWith = '';
          for (let i = fromLineN; i <= toLineN; i++) {
            const startWith = doc.getLine(i).reTabString();
            if (lineN === i) {
              posLineStartWith = startWith;
            }
            if (fromLineN === i) {
              fromLineStartWith = startWith;
            } else if (toLineN === i) {
              toLineStartWith = startWith;
            }
            removed.push(startWith);
          }
          doc.updateDoc(
            new Change({
              from,
              to,
              origin: 'reTab',
              removed,
              text: []
            })
          );
          if (posLineStartWith !== '') {
            doc.updatePos(pos.replace({ ch: pos.ch - posLineStartWith.length }));
          }
          if (fromLineStartWith !== '' || toLineStartWith !== '') {
            const newFromPos = from.replace({ ch: from.ch - fromLineStartWith.length });
            const newToPos = to.replace({ ch: to.ch - toLineStartWith.length });
            doc.updateSelection(new Selection(newFromPos, newToPos));
          }
        } else {
          const startWith = doc.getLine(lineN).reTabString();
          if (startWith !== '') {
            doc.updateDoc(
              new Change({
                from: pos,
                to: pos,
                origin: 'reTab',
                removed: makeArray(startWith),
                text: []
              })
            );
            doc.updatePos(pos.replace({ ch: pos.ch - startWith.length }));
          }
        }
      }
    } else if (shortcutValue === 'save') {
      editor.onSave?.(doc.getCode());
    }
    return;
  }

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
                removed: makeArray(doc.getSelectedCode()),
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
            let text: string;
            if (chIdxBackSpace === 0) {
              if (currentPosBackSpace.line === 0) {
                return;
              } else {
                text = '\n';
                doc.updatePos(
                  new Pos({
                    line: currentPosBackSpace.line - 1,
                    ch: doc.getLineLength(currentPosBackSpace.line - 1) - 1,
                    sticky: 'after'
                  })
                );
              }
            } else {
              text = doc.getLineText(currentPosBackSpace.line).substring(chIdxBackSpace - 1, chIdxBackSpace);
              doc.updatePos(currentPosBackSpace!.replace({ ch: currentPosBackSpace.ch - 1 }));
            }
            doc.updateDoc(
              new Change({
                from: currentPosBackSpace!,
                to: currentPosBackSpace!,
                origin: '-delete',
                removed: makeArray(text),
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
                removed: makeArray(doc.getSelectedCode()),
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
            const currentPosDelete = doc.pos!;
            const currentLineDelete = currentPosDelete.line;
            const currentTextDelete = doc.getLineText(currentLineDelete);
            const chIdxDelete = currentPosDelete.getPosChBySticky();
            let text: string;
            if (chIdxDelete === currentTextDelete.length) {
              if (currentLineDelete === doc.getMaxLineN()) {
                return;
              } else {
                text = '\n';
              }
            } else {
              text = currentTextDelete.substr(chIdxDelete, 1);
            }
            doc.updateDoc(
              new Change({
                from: doc.pos!,
                to: doc.pos!,
                origin: 'delete-',
                removed: makeArray(text),
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
                removed: makeArray(doc.getSelectedCode()),
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
                text: makeArray(Array(to.line - from.line + 1).fill('  '))
              })
            );
            const { startPos, endPos } = doc.sel;
            const newStartPos = startPos.replace({ ch: startPos.ch + 2 });
            const newEndPos = endPos.replace({ ch: endPos.ch + 2 });
            const newSel = new Selection(newStartPos, newEndPos);
            doc.updatePos(newEndPos);
            doc.updateSelection(newSel);
            selected.update(newSel);
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
                text: ['  ']
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
      selected.hidden();
      cursor.updatePosition(newPos);
    }
    return;
  }
}
