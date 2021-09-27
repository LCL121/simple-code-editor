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

  sort() {
    const { startPos, endPos } = this;
    let from: Pos;
    let to: Pos;
    let equal = false;
    if (startPos.cmp(endPos) < 0) {
      from = startPos;
      to = endPos;
    } else if (startPos.cmp(endPos) === 0) {
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
