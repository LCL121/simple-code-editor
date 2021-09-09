import { PosSticky } from './type';
import { Doc } from './doc';
import { range, createTextElement } from './utils';

export class Pos {
  line: number;
  ch: number;
  sticky: PosSticky;

  constructor(line: number, ch: number, sticky = null) {
    this.line = line;
    this.ch = ch;
    this.sticky = sticky;
  }

  static cmp(a: Pos, b: Pos) {
    return a.line - b.line && a.ch - b.ch;
  }

  static equalCursorPos(a: Pos, b: Pos) {
    return a.sticky === b.sticky && Pos.cmp(a, b) === 0;
  }

  static copyPos(x: Pos) {
    return new Pos(x.line, x.ch);
  }

  static maxPos(...poses: Pos[]) {
    return poses.reduce((a, b) => (Pos.cmp(a, b) < 0 ? b : a));
  }

  static minPos(...poses: Pos[]) {
    return poses.reduce((a, b) => (Pos.cmp(a, b) < 0 ? a : b));
  }
}

export function posFromMouse(doc: Doc, e: MouseEvent) {
  const docRect = doc.getDocRect();
  const x = e.clientX - (docRect?.x || 0);
  const y = e.clientY - (docRect?.y || 0);
  const lineN = doc.getLineNAtHeight(y);
  const lineText = doc.getLine(lineN).text;
  const ch = surmisePosCh(lineText, x);
  console.log(ch);
}

function surmisePosCh(text: string, x: number) {
  const len = text.length;
  const textNode = createTextElement(text);
  function searchCh(start: number, end: number): number {
    if (start === end) {
      return start;
    }
    const mid = (start + end / 2) | 0;
    const a = range(textNode, start, mid);
    const b = a.getClientRects();
    const leftRect = range(textNode, start, mid).getClientRects()[0];
    const rightRect = range(textNode, mid, end).getClientRects()[0];
    if (leftRect.left > x && leftRect.right < x) {
      return searchCh(start, mid);
    } else if (rightRect.left > x && rightRect.right < x) {
      return searchCh(mid, end);
    } else {
      return start;
    }
  }
  return searchCh(0, len - 1);
}
