import { ChangeOrigin, mergeOps } from '../shared/constants';
import { Change } from './change';
import { Doc } from './doc';

export class DocHistory {
  private _undo: Change[] = [];
  private _redo: Change[] = [];
  private _isSel: boolean = false; // 标记前一次操作是否选区操作
  private _op?: ChangeOrigin; // 标记前一次操作符
  private _doc: Doc;

  constructor(doc: Doc) {
    this._doc = doc;
  }

  /**
   * 压入undo
   */
  private _pushUndo(c: Change) {
    const { origin, from, to, text, removed } = c;
    if (this._op === origin && origin === 'compose') {
      this._undo[this._undo.length - 1] = c;
      this._isSel = false;
    } else if (from.equalCursorPos(to)) {
      if (this._op === origin && mergeOps.includes(origin as any) && this._isSel === false) {
        if (origin === '-delete') {
          const cur = this._undo[this._undo.length - 1];
          cur.to = this._doc.pos!;
          cur.removed = [...removed!, ...cur.removed!];
        } else if (origin === 'delete-') {
          const cur = this._undo[this._undo.length - 1];
          cur.removed = [...cur.removed!, ...removed!];
        } else if (origin === 'input') {
          const cur = this._undo[this._undo.length - 1];
          cur.to = this._doc.pos!;
          cur.text = [...cur.text, ...text];
        }
      } else {
        this._undo.push(c);
      }
      this._isSel = false;
    } else {
      this._isSel = true;
      this._undo.push(c);
    }
    this._op = origin;
  }

  /**
   * 弹出undo，压入redo
   */
  private _popUndo() {
    const c = this._undo.pop();
    if (c) {
      this._redo.push(c);
    }
  }

  /**
   * 弹出redo，压入undo
   */
  private _popRedo() {
    const c = this._redo.pop();
    if (c) {
      this._undo.push(c);
    }
  }

  push(c: Change) {
    const { origin } = c;
    if (origin === 'undo') {
      this._popUndo();
    } else if (origin === 'redo') {
      this._popRedo();
    } else {
      this._pushUndo(c);
    }
  }
}
