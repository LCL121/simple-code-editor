import { VNode, ChildeVNode, ParentVNode, VNodeEle, VNodeAttrs } from './type';

export class Span implements VNode {
  children: ChildeVNode;
  parent: ParentVNode;
  ele: Text | undefined;
  tag = 'span';
  attrs: VNodeAttrs;
  text: string;
  constructor(text: string, parent: VNode) {
    this.parent;
    this.text = text;
  }
}
