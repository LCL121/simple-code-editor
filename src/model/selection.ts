import { Doc } from './doc';
import { Pos, surmiseInfoFromPos, sortTwoPos } from './pos';

export class Selection {
  private _startPos: Pos;
  private _endPos: Pos;

  constructor(startPos: Pos, endPos: Pos = startPos) {
    this._startPos = startPos;
    this._endPos = endPos;
  }

  get startPos() {
    return this._startPos;
  }

  get endPos() {
    return this._endPos;
  }

  updateEndPos(pos: Pos) {
    this._endPos = pos;
  }

  /**
   * 选区是有效
   * @returns boolean
   */
  isValid() {
    return this.startPos.cmp(this.endPos) !== 0;
  }

  sort() {
    const { startPos, endPos } = this;
    return sortTwoPos(startPos, endPos);
  }

  surmisePosInfo(doc: Doc) {
    surmiseInfoFromPos(this.startPos, doc);
    surmiseInfoFromPos(this.endPos, doc);
  }
}
