import { Line } from './line';
import { Pos, judgeChBySticky } from './pos';
import { Effect } from './effect';
import { Change } from './change';
import { Selection } from './selection';
import { VNode, ParentVNode, NextSiblingVNode, VNodeAttrs, PosMap } from '../shared/type';
import { lineHeight, classPrefix } from '../shared/constants';

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
  constructor(text: string) {
    this.children = this.createLines(text.split(/\r\n?|\n/));
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

  private _getSelectedCode(startPos: Pos, endPos: Pos): string {
    if (startPos.cmpLine(endPos) === 0) {
      return this.getLineText(startPos.line).substring(startPos.getPosChBySticky(), endPos.getPosChBySticky());
    } else {
      const lines = this.children;
      const result: string[] = [];
      result.push(this.getLineText(startPos.line).substring(startPos.getPosChBySticky()));
      for (let i = startPos.line; i < endPos.line; i++) {
        result.push(lines[i].text);
      }
      result.push(this.getLineText(endPos.line).substring(0, endPos.getPosChBySticky()));
      return result.join('\n');
    }
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
      const { startPos, endPos } = sel;
      if (endPos.cmp(startPos) > 0) {
        return this._getSelectedCode(startPos, endPos);
      } else if (endPos.cmp(startPos) < 0) {
        return this._getSelectedCode(endPos, startPos);
      }
    }
    return '';
  }

  getDocRect() {
    return this.ele?.getBoundingClientRect();
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

  pushLine(target: Line, lineN?: number) {
    if (lineN) {
      target.nextSibling = this.getLine(lineN);
      this.getLine(lineN - 1).nextSibling = target;
      this.children.splice(lineN, 0, target);
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

  updateDoc(change: Change) {
    console.log(change);
    const { from, to } = change;
    const fromCh = judgeChBySticky(from.ch, from.sticky);
    const fromLineN = from.line;
    const toCh = judgeChBySticky(to.ch, to.sticky);
    const toLineN = to.line;
    this.clearPosMap(fromLineN, toLineN);
    if (change.origin === 'input') {
      this.children[fromLineN].updateLine({ text: change.text[0], tag: 'add', ch: fromCh });
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
    } else if (change.origin === 'enter') {
      const fromLineText = this.getLineText(fromLineN);
      this.children[fromLineN].updateLine({ tag: 'replace', text: fromLineText.substring(0, fromCh) });
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
      const newLine = this.createLine(fromLineText.substring(fromCh));
      newLine.effectTag = 'add';
      this.pushLine(newLine, fromLineN + 1);
      this.effect.push(newLine);
    } else if (change.origin === '-delete') {
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
    } else if (change.origin === 'delete-') {
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
    }
  }

  updatePos(pos: Pos) {
    this.pos = pos;
  }

  updateSelection(sel: Selection) {
    this.sel = sel;
  }
}
