import { Line } from './line';
import { VNode, ParentVNode, VNodeEle, VNodeAttrs } from './type';

export class Doc implements VNode {
  parent: ParentVNode;
  children: Line[];
  ele: VNodeEle;
  init: boolean;
  tag = 'div';
  attrs: VNodeAttrs;
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

  getLineNAtHeight(h: number) {
    let current = 0;
    let i = 0;
    const lines = this.children.length;
    while (current < h && i < lines) {
      current += this.children[i].height;
      i++;
    }
    return i - 1;
  }

  getLine(n: number) {
    return this.children[n];
  }

  updateDoc() {
    console.log('update doc');
  }
}
