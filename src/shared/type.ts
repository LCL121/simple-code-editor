export interface VNode {
  readonly tag: string;
  readonly parent: ParentVNode;
  readonly children: ChildeVNode;
  readonly nextSibling: NextSiblingVNode;
  readonly attrs: VNodeAttrs;
  ele: VNodeEle;
}

export type ParentVNode = VNode | undefined;

export type ChildeVNode = VNode[] | string | undefined;

export type NextSiblingVNode = VNode | undefined;

export type VNodeEle = HTMLElement | Text | undefined;

export interface VNodeAttr {
  name: string;
  value: string;
}

export type VNodeAttrs = VNodeAttr[];

export type PosSticky = 'before' | 'after' | null;

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
  length?: number;
}

export interface PosMap {
  [lineN: number]: PosMapLine | undefined;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  height: number;
  width: number;
}

export type Mounted = () => void;

export type Updated = (oldValue: string, newValue: string) => void;

export type OnSave = (value: string) => void;
