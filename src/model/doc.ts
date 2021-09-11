import { Line } from './line';
import { Pos } from './pos';
import { VNode, ParentVNode, VNodeEle, VNodeAttrs, PosMap } from '../shared/type';
import { lineHeight, classPrefix } from '../shared/constants';

export class Doc implements VNode {
  parent: ParentVNode;
  children: Line[];
  ele: HTMLElement | undefined;
  init: boolean;
  tag = 'div';
  attrs: VNodeAttrs = [{ name: 'class', value: `${classPrefix}_doc` }];
  lineHeight = lineHeight;
  posMap: PosMap = {};
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

  updateDoc() {
    console.log('update doc');
  }

  updatePos(pos: Pos) {
    this.pos = pos;
  }
}
