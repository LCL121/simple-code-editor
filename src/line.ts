import { VNode, ChildeVNode, ParentVNode, VNodeEle, VNodeAttrs } from './type';
import { classPrefix, lineHeight } from './constants';

export class Line implements VNode {
  children: ChildeVNode;
  parent: ParentVNode;
  ele: VNodeEle;
  tag = 'p';
  attrs: VNodeAttrs = [{ name: 'class', value: `${classPrefix}_line` }];
  text: string;
  height = lineHeight;
  constructor(text: string, parent: VNode) {
    this.children = text;
    this.parent = parent;
    this.text = text;
  }
}
