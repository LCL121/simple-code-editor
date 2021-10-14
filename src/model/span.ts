import { VNode, ChildeVNode, ParentVNode, NextSiblingVNode, VNodeAttrs } from '../shared/type';

export class Span implements VNode {
  children: ChildeVNode;
  parent: ParentVNode;
  nextSibling: NextSiblingVNode = undefined;
  ele: Text | undefined;
  tag = 'span';
  attrs: VNodeAttrs = [];
  text: string;
  constructor(text: string, parent: VNode) {
    this.parent;
    this.text = text;
  }
}
