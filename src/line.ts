import { VNode, ChildeVNode, ParentVNode, VNodeEle, VNodeAttrs } from './type';

export class Line implements VNode {
  children: ChildeVNode;
  parent: ParentVNode;
  ele: VNodeEle;
  tag = 'p';
  attrs: VNodeAttrs;
  constructor(text: string, parent: VNode) {
    this.children = text;
    this.parent = parent;
  }
}
