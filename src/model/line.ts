import { VNode, ChildeVNode, ParentVNode, VNodeEle, VNodeAttrs } from '../shared/type';
import { classPrefix } from '../shared/constants';
import { Span } from './span';

export class Line implements VNode {
  children: Span[] | string;
  parent: ParentVNode;
  ele: HTMLElement | undefined;
  tag = 'p';
  attrs: VNodeAttrs = [{ name: 'class', value: `${classPrefix}_line` }];
  text: string;
  effectTag?: 'update' | 'delete' | 'add';

  constructor(text: string, parent: VNode) {
    this.children = text;
    this.parent = parent;
    this.text = text;
  }

  updateLine(text: string, ch: number, deleteDirection?: 'l' | 'r') {
    let newText: string;
    if (deleteDirection) {
      newText = this.text.substring(0, ch - 1) + this.text.substring(ch);
    } else {
      newText = this.text.substring(0, ch) + text + this.text.substring(ch);
    }
    this.text = newText;
    this.children = newText;
  }
}
