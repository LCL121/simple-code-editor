import { inputTypes, changeOrigin } from './constants';

export interface VNode {
  tag: string;
  parent: ParentVNode;
  children: ChildeVNode;
  ele: VNodeEle;
  attrs: VNodeAttrs;
}

export type ParentVNode = VNode | undefined;

export type ChildeVNode = VNode[] | string | undefined;

export type VNodeEle = HTMLElement | undefined;

export interface VNodeAttr {
  name: string;
  value: string;
}

export type VNodeAttrs = VNodeAttr[] | undefined;

export type InputTypes = typeof inputTypes[number];

export type PosSticky = 'before' | 'after' | null;

export type ChangeOrigin = typeof changeOrigin[number];
