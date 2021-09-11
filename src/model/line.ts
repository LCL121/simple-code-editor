import { VNode, ChildeVNode, ParentVNode, VNodeEle, VNodeAttrs } from '../shared/type';
import { classPrefix } from '../shared/constants';
import { Span } from './span';

export class Line implements VNode {
  children: Span[] | string;
  parent: ParentVNode;
  ele: VNodeEle;
  tag = 'p';
  attrs: VNodeAttrs = [{ name: 'class', value: `${classPrefix}_line` }];
  text: string;

  constructor(text: string, parent: VNode) {
    this.children = text;
    this.parent = parent;
    this.text = text;
  }
}
