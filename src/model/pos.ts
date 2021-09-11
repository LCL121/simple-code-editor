import { PosSticky, Point, PosMapCh, PosMapLine } from '../shared/type';
import { Doc } from './doc';
import { range, isString, isUndefined } from '../shared/utils';
import { docLeftGap } from '../shared/constants';

interface PosOptions {
  line: number;
  ch: number;
  sticky?: PosSticky;
  position?: Point;
}

export class Pos {
  line: number;
  ch: number;
  position: Point;
  sticky: PosSticky;

  constructor(options: PosOptions) {
    const { line, ch, sticky = null, position = { x: 0, y: 0 } } = options;
    this.line = line;
    this.ch = ch;
    this.sticky = sticky;
    this.position = position;
  }

  static cmp(a: Pos, b: Pos) {
    return a.line - b.line && a.ch - b.ch;
  }

  static equalCursorPos(a: Pos, b: Pos) {
    return a.sticky === b.sticky && Pos.cmp(a, b) === 0;
  }

  static copyPos(x: Pos) {
    return new Pos({
      line: x.line,
      ch: x.ch
    });
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
  const { lineN, overLines } = doc.getLineNByHeight(y);
  const lineText = getLineTextMap(lineN, doc);
  const posChInfo = surmisePosChInfo(lineText, x, docRect?.x || 0, overLines);
  return new Pos({
    line: lineN,
    ch: posChInfo.ch,
    sticky: posChInfo.sticky,
    position: {
      x: posChInfo.chX,
      y: lineN * doc.lineHeight
    }
  });
}

function getLineTextMap(lineN: number, doc: Doc) {
  if (doc.posMap[lineN]) {
    return doc.posMap[lineN];
  }
  const lineObj = doc.getLine(lineN);
  const children = lineObj.children;
  const posMapLine: PosMapLine = {};
  let length = 0;
  if (isString(children)) {
    length = 1;
    const text = lineObj.ele?.firstChild as Text;
    const len = lineObj.text.length;
    posMapLine[0] = {
      startCh: 0,
      endCh: len,
      text: text,
      rect: len === 0 ? undefined : range(text, 0, len).getClientRects()[0]
    };
  } else if (!isUndefined(children)) {
    length = children.length;
    let idx = 0;
    for (const child of children) {
      const len = child.text.length;
      const endIdx = idx + len;
      const text = child.ele as Text;
      posMapLine[idx] = {
        startCh: idx,
        endCh: endIdx,
        text: text,
        rect: len === 0 ? undefined : range(text, 0, len).getClientRects()[0]
      };
      idx = endIdx;
    }
  }
  posMapLine.length = length;
  doc.posMap[lineN] = posMapLine;
  return posMapLine;
}

function surmisePosChInfo(lineText: PosMapLine, x: number, docX: number, overLines?: boolean) {
  const keys = Object.keys(lineText).map((key) => Number(key));
  function searchSpan(start: number, end: number): PosMapCh {
    if (start === end) {
      return lineText[keys[start]];
    }
    const mid = ((start + end) / 2) | 0;
    const midSpan = lineText[keys[mid]];
    if (mid === start) {
      return midSpan;
    } else if (midSpan.rect!.left - docX > x) {
      return searchSpan(start, mid);
    } else if (midSpan.rect!.right - docX < x) {
      return searchSpan(mid, end);
    }
    return midSpan;
  }
  const span =
    lineText.length === 1 ? lineText[0] : overLines ? lineText[lineText.length! - 1] : searchSpan(0, keys.length);
  let sticky: PosSticky = 'after';
  let chX = 0;
  if (isUndefined(span.rect)) {
    return {
      ch: span.endCh,
      sticky,
      chX
    };
  }
  if (overLines) {
    return {
      ch: span.text.length,
      sticky,
      chX: span.rect.right - docX
    };
  }
  const textNode = span.text;
  const textLen = span.endCh - span.startCh;
  function searchCh(start: number, end: number): number {
    // first judge
    if (start === end) {
      return start;
    }
    const mid = ((start + end) / 2) | 0;
    if (mid === start) {
      const chRect = range(textNode, start, end).getClientRects()[0];
      const divider = ((chRect.right - chRect.left) * 3) / 4 + chRect.left;
      if (divider - docX > x) {
        sticky = 'before';
        chX = chRect.left;
      } else {
        chX = chRect.right;
      }
      return mid;
    }
    const leftRect = range(textNode, start, mid).getClientRects()[0];
    const rightRect = range(textNode, mid, end).getClientRects()[0];
    if (leftRect.left - docX < x && leftRect.right - docX > x) {
      return searchCh(start, mid);
    } else if (rightRect.left - docX < x && rightRect.right - docX > x) {
      return searchCh(mid, end);
    } else if (rightRect.right - docX < x) {
      chX = rightRect.right;
      return end;
    } else {
      chX = leftRect.left;
      return start;
    }
  }
  return {
    ch: searchCh(0, textLen),
    sticky,
    chX: chX > 0 ? chX - docX : 0
  };
}
