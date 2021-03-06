import { Line } from './line';
import { Pos, judgeChBySticky } from './pos';
import { Effect } from './effect';
import { Change, HistoryChange } from './change';
import { Selection } from './selection';
import { VNode, ParentVNode, NextSiblingVNode, VNodeAttrs, PosMap, Rect, VNodeAttr } from '../shared/type';
import { lineHeight, classPrefix } from '../shared/constants';
import { makeArray, splitTextByEnter } from '../shared/utils';
import { DocHistory } from './history';

export class Doc implements VNode {
  parent: ParentVNode;
  children: Line[];
  nextSibling: NextSiblingVNode = undefined;
  ele: HTMLElement | undefined;
  tag = 'pre';
  attrs: VNodeAttrs = [{ name: 'class', value: `${classPrefix}_doc` }];
  init: boolean;
  reset: boolean = false;
  effect = new Effect<Line>();
  lineHeight = lineHeight;
  mouseDown = false;
  posMap: PosMap = {};
  posMoveOver = false;
  pos?: Pos;
  sel?: Selection;
  /**
   * 用于记录doc rect，避免每次get 都进行reflow
   */
  private _rect?: Rect;
  /**
   * 记录首个位置便于end 时，计算位置
   */
  compositionStartPos?: Pos;
  compositionText = '';
  /**
   * 标志是否使用输入法编辑器
   */
  isComposing = false;
  history: DocHistory;
  /**
   * 标记是否拖拽
   */
  isDrag: boolean = false;
  /**
   * 标记是否更新atrrs
   */
  isUpdateEle: boolean = false;
  effectAttrs: VNodeAttrs = [];

  constructor(text: string) {
    this.children = this._createLines(splitTextByEnter(text));
    this.init = true;
    this.history = new DocHistory(this);
  }

  get rect() {
    return this._rect;
  }

  private _createLines(linesText: string[]) {
    const result: Line[] = [];
    for (let idx = 0; idx < linesText.length; idx++) {
      const newLine = new Line(linesText[idx], this);
      if (idx > 0) {
        result[idx - 1].nextSibling = newLine;
      }
      result.push(newLine);
    }
    return result;
  }

  private _createLine(lineText: string) {
    return new Line(lineText, this);
  }

  getCode(): string {
    const lines = this.children;
    const result: string[] = [];
    for (const line of lines) {
      result.push(line.text);
    }
    return result.join('\n');
  }

  getSelectedCode(): string {
    const sel = this.sel;
    if (sel) {
      const { from, to, equal } = sel.sort();
      if (!equal) {
        if (from.cmpLine(to) === 0) {
          return this.getLineText(from.line).substring(from.getPosChBySticky(), to.getPosChBySticky());
        } else {
          const lines = this.children;
          const result: string[] = [];
          result.push(this.getLineText(from.line).substring(from.getPosChBySticky()));
          for (let i = from.line + 1; i < to.line; i++) {
            result.push(lines[i].text);
          }
          result.push(this.getLineText(to.line).substring(0, to.getPosChBySticky()));
          return result.join('\n');
        }
      }
    }
    return '';
  }

  updateDocRect() {
    const rect = this.ele?.getBoundingClientRect();
    if (rect) {
      this._rect = {
        height: this.ele?.clientHeight || rect.height,
        width: this.ele?.clientWidth || rect.width,
        x: rect.x,
        y: rect.y
      };
    }
  }

  getLinesNum() {
    return this.children.length;
  }

  getMaxLineN() {
    return this.getLinesNum() - 1;
  }

  getLineNByHeight(h: number) {
    const lineN = (h / this.lineHeight) | 0;
    const maxLineN = this.getMaxLineN();
    const overLines = lineN > maxLineN;
    return {
      lineN: overLines ? maxLineN : lineN,
      overLines
    };
  }

  getLine(lineN: number) {
    return this.children[lineN];
  }

  getLineText(lineN: number): string {
    return this.children[lineN].text;
  }

  getLineLength(lineN: number): number {
    return this.children[lineN].text.length;
  }

  getLastLine() {
    return this.children[this.getMaxLineN()];
  }

  pushLine(target: Line, nextSiblingLineN?: number) {
    if (nextSiblingLineN) {
      target.nextSibling = this.getLine(nextSiblingLineN);
      this.getLine(nextSiblingLineN - 1).nextSibling = target;
      this.children.splice(nextSiblingLineN, 0, target);
    } else {
      this.getLastLine().nextSibling = target;
      this.children.push(target);
    }
  }

  removeLine(target: Line) {
    const idx = this.children.indexOf(target);
    if (idx !== -1) {
      const [removed] = this.children.splice(idx, 1);
      if (idx > 0) {
        this.children[idx - 1].nextSibling = removed.nextSibling;
      }
      return true;
    }
    return false;
  }

  clearPosMap(fromLineN: number, toLineN = fromLineN) {
    for (let i = fromLineN; i <= toLineN; i++) {
      this.posMap[i] = undefined;
    }
  }

  private _updateDocEqualPos(change: Change) {
    const { from, to, origin, text, removed } = change;
    const fromCh = judgeChBySticky(from.ch, from.sticky);
    const fromLineN = from.line;
    const toLineN = to.line;
    this.clearPosMap(fromLineN, toLineN);
    if (origin === 'input' || origin === 'compose') {
      this.children[fromLineN].updateLine({ text: text[0], tag: 'add', ch: fromCh });
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
    } else if (origin === 'enter') {
      const fromLineText = this.getLineText(fromLineN);
      this.children[fromLineN].updateLine({ tag: 'replace', text: fromLineText.substring(0, fromCh) });
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
      const newLine = this._createLine(fromLineText.substring(fromCh));
      newLine.effectTag = 'add';
      this.pushLine(newLine, fromLineN + 1);
      this.effect.push(newLine);
    } else if (origin === '-delete') {
      if (fromCh > 0) {
        this.children[fromLineN].updateLine({ tag: 'delete', ch: fromCh });
        this.children[fromLineN].effectTag = 'update';
      } else {
        if (fromLineN === 0) {
          return;
        }
        this.clearPosMap(fromLineN - 1);
        this.children[fromLineN].effectTag = 'delete';
        this.children[fromLineN - 1].updateLine({
          tag: 'add',
          text: this.getLineText(fromLineN),
          ch: this.getLineLength(fromLineN - 1)
        });
        this.children[fromLineN - 1].effectTag = 'update';
        this.effect.push(this.children[fromLineN - 1]);
      }
      this.effect.push(this.children[fromLineN]);
    } else if (origin === 'delete-') {
      if (fromCh < this.getLineLength(fromLineN)) {
        this.children[fromLineN].updateLine({ tag: 'delete', ch: fromCh, deleteDirection: 'r' });
        this.children[fromLineN].effectTag = 'update';
      } else {
        if (fromLineN === this.getMaxLineN()) {
          return;
        } else {
          this.clearPosMap(fromLineN + 1);
          this.children[fromLineN + 1].effectTag = 'delete';
          this.children[fromLineN].updateLine({
            tag: 'add',
            text: this.getLineText(fromLineN + 1),
            ch: this.getLineLength(fromLineN)
          });
          this.children[fromLineN].effectTag = 'update';
          this.effect.push(this.children[fromLineN + 1]);
        }
      }
      this.effect.push(this.children[fromLineN]);
    } else if (origin === 'tab') {
      this.children[fromLineN].updateLine({ text: '  ', tag: 'add', ch: fromCh });
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
    } else if (origin === 'paste') {
      const textLen = text.length;
      const fromLineText = this.getLineText(fromLineN);
      if (textLen === 1) {
        this.children[fromLineN].updateLine({ text: text[0], tag: 'add', ch: fromCh });
        this.children[fromLineN].effectTag = 'update';
        this.effect.push(this.children[fromLineN]);
      } else {
        this.children[fromLineN].updateLine({ tag: 'replace', text: `${fromLineText.substring(0, fromCh)}${text[0]}` });
        this.children[fromLineN].effectTag = 'update';
        this.effect.push(this.children[fromLineN]);
        for (let i = textLen - 1; i > 0; i--) {
          let newLine: Line;
          if (i === textLen - 1) {
            newLine = this._createLine(`${text[i]}${fromLineText.substring(fromCh)}`);
          } else {
            newLine = this._createLine(text[i]);
          }
          newLine.effectTag = 'add';
          this.pushLine(newLine, fromLineN + 1);
          this.effect.push(newLine);
        }
      }
    } else if (origin === 'cut') {
      if (fromLineN === this.getMaxLineN()) {
        this.children[fromLineN].updateLine({ tag: 'replace', text: '' });
        this.children[fromLineN].effectTag = 'update';
        this.effect.push(this.children[fromLineN]);
      } else {
        this.children[fromLineN].effectTag = 'delete';
        this.effect.push(this.children[fromLineN]);
      }
    } else if (origin === 'reTab') {
      if (removed) {
        const removedStartLen = removed[0].length;
        if (removedStartLen > 0) {
          this.children[fromLineN].updateLine({
            tag: 'replace',
            text: this.getLineText(fromLineN).substring(removedStartLen)
          });
          this.children[fromLineN].effectTag = 'update';
          this.effect.push(this.children[fromLineN]);
        }
      }
    }
  }

  private _updateDocUnequalPos(change: Change) {
    const { from, to, origin, text, removed } = change;
    const fromCh = judgeChBySticky(from.ch, from.sticky);
    const fromLineN = from.line;
    const toCh = judgeChBySticky(to.ch, to.sticky);
    const toLineN = to.line;
    this.clearPosMap(fromLineN, toLineN);
    if (origin === 'cut' || origin === '-delete' || origin === 'delete-') {
      const fromLineText = this.getLineText(fromLineN);
      const toLineText = this.getLineText(toLineN);
      this.children[fromLineN].updateLine({
        tag: 'replace',
        text: `${fromLineText.substring(0, fromCh)}${toLineText.substring(toCh)}`
      });
      this.children[fromLineN].effectTag = 'update';
      for (let i = fromLineN; i <= toLineN; i++) {
        if (i !== fromLineN) {
          this.children[i].effectTag = 'delete';
        }
        this.effect.push(this.children[i]);
      }
    } else if (origin === 'enter') {
      const fromLineText = this.getLineText(fromLineN);
      const toLineText = this.getLineText(toLineN);
      this.children[fromLineN].updateLine({ tag: 'replace', text: fromLineText.substring(0, fromCh) });
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
      const newLine = this._createLine(toLineText.substring(toCh));
      newLine.effectTag = 'add';
      this.pushLine(newLine, toLineN + 1);
      this.effect.push(newLine);
      for (let i = fromLineN + 1; i <= toLineN; i++) {
        this.children[i].effectTag = 'delete';
        this.effect.push(this.children[i]);
      }
    } else if (origin === 'tab') {
      for (let i = 0; i < text.length; i++) {
        const curLineN = fromLineN + i;
        this.children[curLineN].updateLine({ tag: 'add', text: text[i], ch: 0 });
        this.children[curLineN].effectTag = 'update';
        this.effect.push(this.children[curLineN]);
      }
    } else if (origin === 'paste' || origin === 'input' || origin === 'compose') {
      /**
       * textLen === to - from => update
       * textLen < to - from => update delete
       * textLen > to - from => update add
       */
      const changeLine = toLineN - fromLineN + 1;
      const textLen = text.length;
      const fromLineText = this.getLineText(fromLineN);
      const toLineText = this.getLineText(toLineN);

      // textLen === 1 特殊处理
      if (textLen === 1) {
        this.children[fromLineN].updateLine({
          tag: 'replace',
          text: `${fromLineText.substring(0, fromCh)}${text}${toLineText.substring(toCh)}`
        });
        this.children[fromLineN].effectTag = 'update';
        this.effect.push(this.children[fromLineN]);

        for (let i = fromLineN + 1; i <= toLineN; i++) {
          this.children[i].effectTag = 'delete';
          this.effect.push(this.children[i]);
        }
        return;
      }

      if (changeLine >= textLen) {
        for (let i = 0; i < textLen; i++) {
          const curText = text[i];
          const curLineN = i + fromLineN;
          if (i === 0) {
            this.children[curLineN].updateLine({
              tag: 'replace',
              text: `${fromLineText.substring(0, fromCh)}${curText}`
            });
          } else if (i === textLen - 1) {
            this.children[curLineN].updateLine({
              tag: 'replace',
              text: `${curText}${toLineText.substring(toCh)}`
            });
          } else {
            this.children[curLineN].updateLine({ tag: 'replace', text: curText });
          }
          this.children[curLineN].effectTag = 'update';
          this.effect.push(this.children[curLineN]);
        }
      }
      if (changeLine > textLen) {
        for (let i = textLen + fromLineN; i <= toLineN; i++) {
          this.children[i].effectTag = 'delete';
          this.effect.push(this.children[i]);
        }
      } else if (changeLine < textLen) {
        for (let i = 0; i < changeLine; i++) {
          const curText = text[i];
          const curLineN = i + fromLineN;
          if (i === 0) {
            this.children[curLineN].updateLine({
              tag: 'replace',
              text: `${fromLineText.substring(0, fromCh)}${curText}`
            });
          } else {
            this.children[curLineN].updateLine({ tag: 'replace', text: curText });
          }
          this.children[curLineN].effectTag = 'update';
          this.effect.push(this.children[curLineN]);
        }
        for (let i = textLen - 1; i >= changeLine; i--) {
          const curText = textLen - 1 === i ? `${text[i]}${toLineText.substring(toCh)}` : text[i];
          const newLine = this._createLine(curText);
          newLine.effectTag = 'add';
          this.pushLine(newLine, changeLine + fromLineN);
          this.effect.push(newLine);
        }
      }
    } else if (origin === 'reTab') {
      if (removed) {
        for (let i = 0; i < removed.length; i++) {
          const curLineN = fromLineN + i;
          if (removed[i] !== '') {
            const removedStartLen = removed[i].length;
            this.children[curLineN].updateLine({
              tag: 'replace',
              text: this.getLineText(curLineN).substring(removedStartLen)
            });
            this.children[curLineN].effectTag = 'update';
            this.effect.push(this.children[curLineN]);
          }
        }
      }
    } else if (origin === 'drag') {
      this.clearPosMap(0, this.getMaxLineN());
      this.updateDoc(
        new Change({
          from,
          to,
          origin: '-delete',
          text: []
        }),
        false
      );
      if (this.pos) {
        if (to.cmp(this.pos) < 0) {
          let newPos: Pos;
          if (to.line === this.pos.line) {
            const newChX = from.getPosChBySticky() + this.pos.getPosChBySticky() - to.getPosChBySticky();
            newPos = new Pos({
              line: from.line,
              ch: newChX,
              sticky: 'before'
            });
          } else {
            newPos = this.pos;
          }
          this.updateDoc(
            new Change({
              from: newPos,
              to: newPos,
              origin: 'paste',
              text
            }),
            false
          );
        } else {
          this.updateDoc(
            new Change({
              from: this.pos,
              to: this.pos,
              origin: 'paste',
              text
            }),
            false
          );
        }
      }
    }
  }

  updateDoc(change: Change, isPush = true) {
    if (isPush) {
      console.log(change);
      this.history.push(change);
    } else {
      console.log(false, change);
    }
    if (change.from.equalCursorPos(change.to)) {
      this._updateDocEqualPos(change);
    } else {
      this._updateDocUnequalPos(change);
    }
  }

  updateDocUndo(hChange: HistoryChange) {
    const { origin, text, removed, from: start, to: end, isSel, dragSelection } = hChange;
    const { from, to, equal } = hChange.sort();
    if (origin === '-delete') {
      const removedText = removed?.[0];
      if (removedText) {
        const texts = splitTextByEnter(removedText);
        this.updatePos(to);
        this.updateDoc(
          new Change({
            origin: 'paste',
            from: from,
            to: from,
            text: makeArray(texts)
          }),
          false
        );
        if (isSel) {
          this.updateSelection(new Selection(start, end));
        }
      }
    } else if (origin === 'delete-') {
      const removedText = removed?.[0];
      if (removedText) {
        const texts = splitTextByEnter(removedText);
        this.updatePos(from);
        this.updateDoc(
          new Change({
            origin: 'paste',
            from: from,
            to: from,
            text: makeArray(texts)
          }),
          false
        );
        if (isSel) {
          this.updateSelection(new Selection(start, end));
        }
      }
    } else if (origin === 'input') {
      if (removed) {
        // 有选区的input
        const removedText = removed[0];
        if (removedText) {
          const texts = splitTextByEnter(removedText);
          this.updateDoc(
            new Change({
              from,
              // input 只有一个text
              to: from.replace({ ch: from.ch + text[0].length }),
              origin: 'paste',
              text: makeArray(texts)
            }),
            false
          );
          this.updatePos(to);
          this.updateSelection(new Selection(start, end));
        }
      } else {
        this.updatePos(from);
        this.updateDoc(
          new Change({
            from,
            // 避免最后一个字符没有被删除
            to: to.replace({ ch: to.ch + 1 }),
            origin: '-delete',
            text: []
          }),
          false
        );
      }
    } else if (origin === 'compose') {
      this.updateDoc(
        new Change({
          origin: '-delete',
          from,
          // compose 只有一个text
          to: from.replace({ ch: from.ch + text[0].length }),
          text: []
        }),
        false
      );
      this.updatePos(from);
    } else if (origin === 'enter') {
      const newPos = new Pos({
        line: from.line + 1,
        ch: 0,
        sticky: 'before'
      });
      if (equal) {
        this.updateDoc(
          new Change({
            from: newPos,
            to: newPos,
            origin: '-delete',
            text: []
          }),
          false
        );
        this.updatePos(from);
      } else {
        if (removed) {
          this.updateDoc(
            new Change({
              from,
              to: newPos,
              origin: 'paste',
              text: makeArray(splitTextByEnter(removed[0]))
            }),
            false
          );
          this.updatePos(end);
          this.updateSelection(new Selection(start, end));
        }
      }
    } else if (origin === 'paste') {
      let newToPos: Pos;
      if (text.length > 1) {
        newToPos = new Pos({ line: from.line + text.length - 1, ch: text[text.length - 1].length, sticky: 'before' });
      } else {
        newToPos = from.replace({ ch: from.ch + text[0].length });
      }
      // removed === undefined => 无选区
      if (removed) {
        this.updateDoc(
          new Change({
            origin: 'paste',
            from,
            to: newToPos,
            text: splitTextByEnter(removed[0])
          }),
          false
        );
        this.updatePos(end);
        this.updateSelection(new Selection(start, end));
      } else {
        this.updateDoc(
          new Change({
            origin: 'delete-',
            from,
            to: newToPos,
            text: []
          }),
          false
        );
        this.updatePos(from);
      }
    } else if (origin === 'cut') {
      if (removed) {
        const texts = makeArray(splitTextByEnter(removed[0]));
        if (equal) {
          const newPos = new Pos({
            line: from.line,
            ch: 0,
            sticky: 'before'
          });
          this.updateDoc(
            new Change({
              from: newPos,
              to: newPos,
              origin: 'paste',
              text: texts
            }),
            false
          );
          this.updatePos(from);
        } else {
          this.updateDoc(
            new Change({
              from,
              to: from,
              origin: 'paste',
              text: texts
            }),
            false
          );
          this.updatePos(end);
          this.updateSelection(new Selection(start, end));
        }
      }
    } else if (origin === 'tab') {
      if (start.equalCursorPos(end)) {
        this.updateDoc(
          new Change({
            origin: 'delete-',
            from: start,
            to: end.replace({ ch: end.ch + 2 }),
            text: [],
            removed: text
          }),
          false
        );
      } else {
        this.updateDoc(new Change({ origin: 'reTab', from: start, to: end, text: [], removed: text }), false);
        this.updateSelection(new Selection(start, end));
      }
      this.updatePos(end);
    } else if (origin === 'reTab') {
      if (removed) {
        let fromPos: Pos = start;
        let toPos: Pos = end;
        if (start.equalCursorPos(end)) {
          const startCh = start.getPosChBySticky() - 2;
          const endCh = end.getPosChBySticky() - 2;
          fromPos = new Pos({ ch: startCh < 0 ? 0 : startCh, sticky: 'before', line: start.line });
          toPos = new Pos({ ch: endCh < 0 ? 0 : endCh, sticky: 'before', line: end.line });
        }
        this.updateDoc(
          new Change({
            origin: 'tab',
            from: fromPos,
            to: toPos,
            text: removed
          }),
          false
        );
        this.updatePos(end);
        this.updateSelection(new Selection(fromPos, toPos));
      }
    } else if (origin === 'drag') {
      if (dragSelection) {
        const { from: dragFrom, to: dragTo } = dragSelection?.sort();
        this.updatePos(from);
        this.updateDoc(
          new Change({
            from: dragFrom,
            to: dragTo,
            origin,
            text
          }),
          false
        );
        this.updatePos(end);
        this.updateSelection(new Selection(from, to));
      }
    }
  }

  updateDocRedo(hChange: HistoryChange) {
    const { isSel, from: start, to: end, text, origin, removed, dragPos, dragSelection } = hChange;
    const { from, to } = hChange.sort();
    if (origin === '-delete') {
      this.updateDoc(
        new Change({
          from,
          to,
          origin: '-delete',
          text: []
        }),
        false
      );
      this.updatePos(from);
      this.updateSelection(new Selection(from));
    } else if (origin === 'delete-') {
      if (isSel) {
        this.updateDoc(hChange.toChange(), false);
      } else {
        const removedText = removed?.[0];
        if (removedText) {
          const texts = splitTextByEnter(removedText);
          const lastText = texts[texts.length - 1];
          let newToPos: Pos;
          if (texts.length === 1) {
            newToPos = from.replace({ ch: from.ch + lastText.length });
          } else {
            newToPos = new Pos({
              line: from.line + texts.length - 1,
              ch: lastText.length,
              sticky: 'before'
            });
          }
          this.updateDoc(
            new Change({
              from,
              to: newToPos,
              origin: 'delete-',
              text: []
            }),
            false
          );
        }
      }
      this.updatePos(from);
      this.updateSelection(new Selection(from));
    } else if (origin === 'input') {
      if (isSel) {
        this.updateDoc(
          new Change({
            from,
            to,
            origin: 'paste',
            text
          }),
          false
        );
        /**
         * 目前text 为一位 ==> 之后需要处理，input 合并
         */
        const newPos = from.replace({ ch: from.ch + 1 });
        this.updatePos(newPos);
        this.updateSelection(new Selection(newPos));
      } else {
        this.updateDoc(
          new Change({
            from,
            to: from,
            origin: 'paste',
            text
          }),
          false
        );
        // 因为替换时，少了一位
        const newPos = to.replace({ ch: to.ch + 1 });
        this.updatePos(newPos);
        this.updateSelection(new Selection(newPos));
      }
    } else if (origin === 'compose') {
      this.updateDoc(hChange.toChange(), false);
      this.updatePos(end);
      this.updateSelection(new Selection(end));
    } else if (origin === 'enter') {
      this.updateDoc(hChange.toChange(), false);
      const newPos = new Pos({
        line: from.line + 1,
        ch: 0,
        sticky: 'before'
      });
      this.updatePos(newPos);
      this.updateSelection(new Selection(newPos));
    } else if (origin === 'paste') {
      this.updateDoc(hChange.toChange(), false);
      const lastText = text[text.length - 1];
      let newToPos: Pos;
      if (text.length === 1) {
        newToPos = from.replace({ ch: from.ch + lastText.length });
      } else {
        newToPos = new Pos({
          line: from.line + text.length - 1,
          ch: lastText.length,
          sticky: 'before'
        });
      }
      this.updatePos(newToPos);
      this.updateSelection(new Selection(newToPos));
    } else if (origin === 'cut') {
      this.updateDoc(hChange.toChange(), false);
      let newPos: Pos;
      if (isSel) {
        newPos = from;
      } else {
        newPos = new Pos({
          line: from.line,
          ch: 0,
          sticky: 'before'
        });
      }
      this.updatePos(newPos);
      this.updateSelection(new Selection(newPos));
    } else if (origin === 'tab') {
      this.updateDoc(hChange.toChange(), false);
      if (isSel) {
        const newStartPos = start.replace({ ch: start.ch + 2 });
        const newEndPos = end.replace({ ch: end.ch + 2 });
        this.updatePos(newEndPos);
        this.updateSelection(new Selection(newStartPos, newEndPos));
      } else {
        const newPos = from.replace({ ch: from.ch + 2 });
        this.updatePos(newPos);
        this.updateSelection(new Selection(newPos));
      }
    } else if (origin === 'reTab') {
      this.updateDoc(hChange.toChange(), false);
      if (isSel) {
        if (removed && removed.length > 0) {
          const newFromPos = from.replace({ ch: from.ch - removed[0].length });
          const newToPos = to.replace({ ch: to.ch - removed[removed.length - 1].length });
          if (end.equalCursorPos(from)) {
            this.updatePos(newFromPos);
          } else {
            this.updatePos(newToPos);
          }
          this.updateSelection(new Selection(newFromPos, newToPos));
        }
      } else {
        const removedText = removed?.[0];
        if (removedText) {
          const newPos = from.replace({ ch: from.ch - removedText.length });
          this.updatePos(newPos);
          this.updateSelection(new Selection(newPos));
        }
      }
    } else if (origin === 'drag') {
      if (dragPos && dragSelection) {
        this.updatePos(dragPos);
        this.updateDoc(hChange.toChange(), false);
        this.updatePos(dragSelection.endPos);
        this.updateSelection(dragSelection);
      }
    }
  }

  updatePos(pos: Pos) {
    this.pos = pos;
  }

  updateSelection(sel: Selection) {
    this.sel = sel;
  }

  updateAttrs(attrs: VNodeAttr | VNodeAttrs) {
    this.isUpdateEle = true;
    if (Array.isArray(attrs)) {
      for (const attr of attrs) {
        updateAttrsItem(this, attr);
      }
    } else {
      updateAttrsItem(this, attrs);
    }
  }

  resetValue(value: string) {
    this.ele?.remove();
    this.reset = true;

    this.children = this._createLines(splitTextByEnter(value));
    this.ele = undefined;
    this.nextSibling = undefined;
    this.effect = new Effect<Line>();
    this.mouseDown = false;
    this.posMap = {};
    this.posMoveOver = false;
    this.pos = undefined;
    this.sel = undefined;
    this._rect = undefined;
    this.compositionStartPos = undefined;
    this.compositionText = '';
    this.isComposing = false;
    this.history = new DocHistory(this);
    this.isDrag = false;
    this.isUpdateEle = false;
    this.effectAttrs = [];
  }
}

function updateAttrsItem(doc: Doc, attr: VNodeAttr) {
  const selected = doc.attrs?.find((value) => {
    if (value.name === attr.name) {
      return true;
    }
  });
  if (selected) {
    if (attr.value !== selected.value) {
      selected.value = attr.value;
      doc.effectAttrs.push(attr);
    }
  } else {
    doc.attrs?.push(attr);
    doc.effectAttrs.push(attr);
  }
}
