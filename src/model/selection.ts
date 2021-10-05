import { Doc } from './doc';
import { Pos, surmiseInfoFromPos, sortTwoPos } from './pos';

export class Selection {
  startPos: Pos;
  endPos: Pos;

  constructor(startPos: Pos, endPos: Pos = startPos) {
    this.startPos = startPos;
    this.endPos = endPos;
  }

  updateEndPos(pos: Pos) {
    this.endPos = pos;
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
