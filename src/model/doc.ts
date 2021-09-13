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

  getLine(n: number) {
    return this.children[n];
  }

  updateDoc(change: Change) {
    console.log(change);
    const { from, to } = change;
    for (let i = from.line; i <= to.line; i++) {
      this.posMap[i] = undefined;
    }
    const fromCh = judgeChBySticky(from.ch, from.sticky);
    const toCh = judgeChBySticky(to.ch, to.sticky);
    if (change.origin === 'input') {
      this.children[from.line].updateLine(change.text[0], fromCh);
      this.children[from.line].effectTag = 'update';
      this.effect.push(this.children[from.line]);
    } else if (change.origin === '-delete') {
      if (fromCh > 0) {
        this.children[from.line].updateLine('', fromCh, 'l');
        this.children[from.line].effectTag = 'update';
      } else {
        this.children[from.line].effectTag = 'delete';
      }
      this.effect.push(this.children[from.line]);
    }
  }

  updatePos(pos: Pos) {
    this.pos = pos;
  }
}
