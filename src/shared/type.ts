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

export type VNodeEle = HTMLElement | Text | undefined;

export interface VNodeAttr {
  name: string;
  value: string;
}

export type VNodeAttrs = VNodeAttr[] | undefined;

export type InputTypes = typeof inputTypes[number];

export type PosSticky = 'before' | 'after' | null;

export type ChangeOrigin = typeof changeOrigin[number];

type TupleOf<T, N extends number> = N extends N ? (number extends N ? T[] : _TupleOf<T, N, []>) : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;
type DropFirst<T extends readonly unknown[]> = T extends readonly [any?, ...infer U] ? U : [...T];

type RepeatStringRec<S extends string, T extends unknown[]> = T['length'] extends 1
  ? S
  : `${S}${RepeatStringRec<S, DropFirst<T>>}`;

export type RepeatString<S extends string, N extends number> = RepeatStringRec<S, TupleOf<unknown, N>>;

export interface PosMapCh {
  startCh: number;
  endCh: number;
  text: Text;
  rect?: DOMRect;
}

export interface PosMapLine {
  [startCh: number]: PosMapCh;
}

export interface PosMap {
  [lineN: number]: PosMapLine;
}

export interface Point {
  x: number;
  y: number;
}
