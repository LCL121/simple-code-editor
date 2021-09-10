import { VNode, ParentVNode, ChildeVNode, VNodeEle, VNodeAttrs } from './type';

export class Text implements VNode {
  parent: ParentVNode;
  children: ChildeVNode;
  tag = 'text';
  ele: VNodeEle;
  text: string;
  attrs: VNodeAttrs;
  constructor(text: string, parent: VNode) {
    this.parent = parent;
    this.text = text;
  }
}
