import { Pos } from './pos';

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
    let from: Pos;
    let to: Pos;
    let equal = false;
    if (startPos.cmp(endPos) < 0) {
      from = startPos;
      to = endPos;
    } else if (!this.isValid()) {
      from = startPos;
      to = endPos;
      equal = true;
    } else {
      from = endPos;
      to = startPos;
    }
    return {
      from,
      to,
      equal
    };
  }
}
