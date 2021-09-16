import { Line } from './line';
import { Pos, judgeChBySticky } from './pos';
import { Effect } from './effect';
import { Change } from './change';
import { VNode, ParentVNode, VNodeEle, VNodeAttrs, PosMap } from '../shared/type';
import { lineHeight, classPrefix } from '../shared/constants';

export class Doc implements VNode {
  parent: ParentVNode;
  children: Line[];
  ele: HTMLElement | undefined;
  init: boolean;
  tag = 'pre';
  attrs: VNodeAttrs = [{ name: 'class', value: `${classPrefix}_doc` }];
  effect = new Effect<Line>();
  lineHeight = lineHeight;
  posMap: PosMap = {};
  posMoveOver = false;
  pos?: Pos;
  constructor(text: string) {
    this.children = this.createLines(text.split(/\r\n?|\n/));
    this.init = true;
  }

  createLines(linesText: string[]) {
    const result: Line[] = [];
    for (const text of linesText) {
      result.push(new Line(text, this));
    }
    return result;
  }

  getCode() {
    const lines = this.children;
    const result = [];
    for (const line of lines) {
      result.push(line.text);
    }
    return result.join('\n');
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

  removeLine(target: Line) {
    const idx = this.children.indexOf(target);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      return true;
    }
    return false;
  }

  updateDoc(change: Change) {
    console.log(change);
    const { from, to } = change;
    const fromCh = judgeChBySticky(from.ch, from.sticky);
    const fromLineN = from.line;
    const toCh = judgeChBySticky(to.ch, to.sticky);
    const toLineN = to.line;
    for (let i = fromLineN; i <= to.line; i++) {
      this.posMap[i] = undefined;
    }
    if (change.origin === 'input') {
      this.children[fromLineN].updateLine(change.text[0], fromCh);
      this.children[fromLineN].effectTag = 'update';
      this.effect.push(this.children[fromLineN]);
    } else if (change.origin === '-delete') {
      if (fromCh > 0) {
        this.children[fromLineN].updateLine('', fromCh, 'l');
        this.children[fromLineN].effectTag = 'update';
      } else {
        if (fromLineN === 0) {
          return;
        }
        this.children[fromLineN].effectTag = 'delete';
        this.children[fromLineN - 1].updateLine(this.getLineText(fromLineN), this.getLineLength(fromLineN - 1));
        this.children[fromLineN - 1].effectTag = 'update';
        this.effect.push(this.children[fromLineN - 1]);
      }
      this.effect.push(this.children[fromLineN]);
    } else if (change.origin === 'delete-') {
      if (fromCh < this.getLineLength(fromLineN)) {
        this.children[fromLineN].updateLine('', fromCh, 'r');
        this.children[fromLineN].effectTag = 'update';
      } else {
        if (fromLineN === this.getLinesNum() - 1) {
          return;
        } else {
          this.children[fromLineN + 1].effectTag = 'delete';
          this.children[fromLineN].updateLine(this.getLineText(fromLineN + 1), this.getLineLength(fromLineN));
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
}
