import { VNode, NextSiblingVNode, ParentVNode, VNodeEle, VNodeAttrs } from '../shared/type';
import { classPrefix } from '../shared/constants';
import { Span } from './span';

interface UpdateLineOptions {
  tag: 'add' | 'replace' | 'delete' | 'slice';
  ch?: number;
  text?: string;
  deleteDirection?: 'l' | 'r';
}

export class Line implements VNode {
  children: Span[] | string;
  parent: ParentVNode;
  nextSibling: NextSiblingVNode = undefined;
  ele: HTMLElement | undefined;
  tag = 'p';
  attrs: VNodeAttrs = [{ name: 'class', value: `${classPrefix}_line` }];
  text: string;
  private _effectTag?: 'update' | 'delete' | 'add';

  get effectTag() {
    return this._effectTag;
  }

  set effectTag(tag) {
    if (this._effectTag === 'delete' && tag !== undefined) {
      throw Error('effect tag is delete');
    }
    this._effectTag = tag;
  }

  constructor(text: string, parent: VNode, nextSibling?: VNode) {
    this.children = text;
    this.parent = parent;
    this.nextSibling = nextSibling;
    this.text = text;
  }

  isValid() {
    if (this._effectTag === 'delete') {
      return false;
    }
    return true;
  }

  updateLine(options: UpdateLineOptions) {
    const { tag, ch, deleteDirection = 'l', text = '' } = options;
    let newText: string;
    if (tag === 'add') {
      newText = this.text.substring(0, ch) + text + this.text.substring(ch!);
    } else if (tag === 'delete') {
      if (deleteDirection === 'l') {
        newText = this.text.substring(0, ch! - 1) + this.text.substring(ch!);
      } else {
        newText = this.text.substring(0, ch) + this.text.substring(ch! + 1);
      }
    } else {
      newText = text!;
    }
    this.text = newText;
    this.children = newText;
  }

  reTabString() {
    if (this.text.startsWith('  ')) {
      return '  ';
    } else if (this.text.startsWith(' ')) {
      return ' ';
    } else {
      return '';
    }
  }
}
