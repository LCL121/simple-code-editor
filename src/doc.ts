import { Line } from './line';
import { VNode, ChildeVNode, ParentVNode, VNodeEle, VNodeAttrs } from './type';

export class Doc implements VNode {
  parent: ParentVNode;
  children: ChildeVNode;
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

  updateDoc() {
    console.log('update doc');
  }
}
