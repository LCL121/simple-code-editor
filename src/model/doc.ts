import { Line } from './line';
import { Pos, judgeChBySticky } from './pos';
import { Effect } from './effect';
import { Change } from './change';
import { Selection } from './selection';
import { VNode, ParentVNode, NextSiblingVNode, VNodeAttrs, PosMap } from '../shared/type';
import { lineHeight, classPrefix } from '../shared/constants';
import { splitTextByEnter } from '../shared/utils';

export class Doc implements VNode {
  parent: ParentVNode;
  children: Line[];
  nextSibling: NextSiblingVNode = undefined;
  ele: HTMLElement | undefined;
  init: boolean;
  tag = 'pre';
  attrs: VNodeAttrs = [{ name: 'class', value: `${classPrefix}_doc` }];
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
  private rect?: DOMRect;
  /**
   * 标志是否使用输入法编辑器，
   * 并且记录首个位置便于end 时，计算位置
   */
  compositionStartPos?: Pos;
  compositionText = '';
  constructor(text: string) {
    this.children = this.createLines(splitTextByEnter(text));
    this.init = true;
  }

  private createLines(linesText: string[]) {
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

  private createLine(lineText: string) {
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
    this.rect = this.ele?.getBoundingClientRect();
  }

  getDocRect() {
    return this.rect;
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
      this.children.splice(idx, 1);
      return true;
    }
    return false;
  }

  clearPosMap(fromLineN: number, toLineN = fromLineN) {
    for (let i = fromLineN; i <= toLineN; i++) {
      this.posMap[i] = undefined;
    }
  }

  private updateDocEqualPos(change: Change) {
    const { from, to, origin, text } = change;
    const fromCh = judgeChBySticky(from.ch, from.sticky);
    const fromLineN = from.line;
    const toLineN = to.line;
    this.clearPosMap(fromLineN, toLineN);
    if (origin === 'input') {
      this.children[fromLineN].updateLine({ text: text[0], tag: 'add', ch: fromCh });
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
    } else if (origin === 'enter') {
      const fromLineText = this.getLineText(fromLineN);
      this.children[fromLineN].updateLine({ tag: 'replace', text: fromLineText.substring(0, fromCh) });
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
      const newLine = this.createLine(fromLineText.substring(fromCh));
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
      this.children[fromLineN].updateLine({ text: text[0], tag: 'add', ch: fromCh });
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
      for (let i = textLen - 1; i > 0; i--) {
        let newLine: Line;
        if (i === textLen - 1) {
          newLine = this.createLine(`${text[i]}${fromLineText.substring(fromCh)}`);
        } else {
          newLine = this.createLine(text[i]);
        }
        newLine.effectTag = 'add';
        this.pushLine(newLine, fromLineN + 1);
        this.effect.push(newLine);
      }
    }
  }

  private updateDocUnequalPos(change: Change) {
    const { from, to, origin, text } = change;
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
      const newLine = this.createLine(toLineText.substring(toCh));
      newLine.effectTag = 'add';
      this.pushLine(newLine, toLineN + 1);
      this.effect.push(newLine);
      for (let i = fromLineN + 1; i <= toLineN; i++) {
        this.children[i].effectTag = 'delete';
        this.effect.push(this.children[i]);
      }
    } else if (origin === 'tab') {
      for (let i = fromLineN; i <= toLineN; i++) {
        this.children[i].updateLine({ tag: 'add', text: '  ', ch: 0 });
        this.children[i].effectTag = 'update';
        this.effect.push(this.children[i]);
      }
    } else if (origin === 'paste') {
      /**
       * textLen === to - from => update
       * textLen < to - from => update delete
       * textLen > to - from => update add
       */
      const changeLine = toLineN - fromLineN + 1;
      const textLen = text.length;
      const fromLineText = this.getLineText(fromLineN);

      // len === 1 特殊处理
      if (textLen === changeLine && textLen === 1) {
        this.children[fromLineN].updateLine({
          tag: 'replace',
          text: `${fromLineText.substring(0, fromCh)}${text}${fromLineText.substring(toCh)}`
        });
        this.children[fromLineN].effectTag = 'update';
        this.effect.push(this.children[fromLineN]);
        return;
      }

      const toLineText = this.getLineText(toLineN);
      const minLen = Math.min(changeLine, textLen);

      for (let i = 0; i < minLen; i++) {
        const curText = text[i];
        const curLineN = i + fromLineN;
        if (curLineN === fromLineN) {
          this.children[curLineN].updateLine({
            tag: 'replace',
            text: `${fromLineText.substring(0, fromCh)}${curText}`
          });
        } else if (curLineN === minLen - 1 + fromLineN) {
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

      if (textLen < changeLine) {
        for (let i = minLen + fromLineN; i <= toLineN; i++) {
          this.children[i].effectTag = 'delete';
          this.effect.push(this.children[i]);
        }
      } else if (textLen > changeLine) {
        for (let i = textLen - 1; i >= minLen; i--) {
          const newLine = this.createLine(text[i]);
          newLine.effectTag = 'add';
          this.pushLine(newLine, minLen);
          this.effect.push(newLine);
        }
      }
    }
  }

  updateDoc(change: Change) {
    console.log(change);
    if (change.from.equalCursorPos(change.to)) {
      this.updateDocEqualPos(change);
    } else {
      this.updateDocUnequalPos(change);
    }
  }

  updatePos(pos: Pos) {
    this.pos = pos;
  }

  updateSelection(sel: Selection) {
    this.sel = sel;
  }
}
