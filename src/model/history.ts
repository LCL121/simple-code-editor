import { ChangeOrigin, mergeOps } from '../shared/constants';
import { makeArray } from '../shared/utils';
import { Change, HistoryChange } from './change';
import { Doc } from './doc';
import { Pos } from './pos';
import { Selection } from './selection';

export class DocHistory {
  private readonly _undo: HistoryChange[] = [];
  private readonly _redo: HistoryChange[] = [];
  private readonly _doc: Doc;
  private _isSel: boolean = false; // 标记前一次操作是否选区操作
  private _op?: ChangeOrigin; // 标记前一次操作符

  constructor(doc: Doc) {
    this._doc = doc;
  }

  /**
   * 压入undo
   */
  private _pushUndo(c: Change) {
    const { origin, from, to, text, removed } = c;
    this._clearRedo();
    if (this._op === origin && origin === 'compose') {
      this._undo[this._undo.length - 1] = c.toHistoryChange();
      this._isSel = false;
    } else if (from.equalCursorPos(to)) {
      if (this._op === origin && mergeOps.includes(origin as any) && this._isSel === false) {
        if (origin === '-delete') {
          const cur = this._undo.pop();
          if (cur) {
            const newChange = cur.replace({
              to: this._doc.pos,
              removed: makeArray(`${removed?.join('') || ''}${cur.removed?.join('') || ''}`)
            });
            this._undo.push(newChange);
          }
        } else if (origin === 'delete-') {
          const cur = this._undo.pop();
          if (cur) {
            const newChange = cur.replace({
              removed: makeArray(`${cur.removed?.join('') || ''}${removed?.join('') || ''}`)
            });
            this._undo.push(newChange);
          }
        } else if (origin === 'input') {
          const cur = this._undo.pop();
          if (cur) {
            const newChange = cur.replace({
              to: this._doc.pos,
              text: makeArray(`${cur.text.join('')}${text.join('')}`)
            });
            this._undo.push(newChange);
          }
        }
      } else {
        this._undo.push(c.toHistoryChange());
      }
      this._isSel = false;
    } else if (origin === 'drag') {
      this._isSel = true;
      const pos = this._doc.pos;
      if (pos) {
        let sel: Selection;
        if (text.length === 1) {
          const newPos = new Pos({
            line: pos.line,
            ch: pos.getPosChBySticky() + text[0].length,
            sticky: 'before'
          });
          sel = new Selection(pos, newPos);
        } else {
          let line: number;
          let startPos: Pos;
          if (to.cmp(pos) < 0) {
            line = pos.line;
            if (pos.line === to.line) {
              startPos = pos.replace({
                line: pos.line - text.length + 1,
                ch: pos.getPosChBySticky() - to.getPosChBySticky() + from.getPosChBySticky(),
                sticky: 'before'
              });
            } else {
              startPos = pos.replace({ line: pos.line - text.length + 1 });
            }
          } else {
            line = pos.line + text.length - 1;
            startPos = pos;
          }
          const newPos = new Pos({
            line,
            ch: text[text.length - 1].length,
            sticky: 'before'
          });
          sel = new Selection(startPos, newPos);
        }
        this._undo.push(c.toHistoryChange(true, sel, pos));
      }
    } else {
      this._isSel = true;
      this._undo.push(c.toHistoryChange(true));
    }
    this._op = origin;
  }

  /**
   * 弹出undo，压入redo
   */
  private _popUndo() {
    const c = this._undo.pop();
    if (c) {
      this._doc.updateDocUndo(c);
      this._redo.push(c);
      this._op = 'undo';
      this._isSel = false;
    }
  }

  /**
   * 弹出redo，压入undo
   */
  private _popRedo() {
    const c = this._redo.pop();
    if (c) {
      this._doc.updateDocRedo(c);
      this._undo.push(c);
      this._op = 'redo';
      this._isSel = false;
    }
  }

  /**
   * 当有新操作时，清空redo
   * code mirror以及vscode 逻辑
   */
  private _clearRedo() {
    while (this._redo.length > 0) {
      this._redo.pop();
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
