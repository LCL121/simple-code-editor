import { Pos } from './pos';

export class Selection {
  startPos: Pos;
  endPos: Pos;

  constructor(startPos: Pos, endPos: Pos) {
    this.startPos = startPos;
    this.endPos = endPos;
  }

  updateEndPos(pos: Pos) {
    this.endPos = pos;
  }
}
