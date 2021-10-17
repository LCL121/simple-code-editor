import { Pos, sortTwoPos } from './pos';
import { Selection } from './selection';
import { ChangeOrigin } from '../shared/constants';
import { isUndefined } from '../shared/utils';

interface ChangeBaseOptions {
  from: Pos;
  to: Pos;
  origin: ChangeOrigin;
  removed?: string[];
  text: string[];
}

class ChangeBase {
  readonly from: Pos;
  readonly to: Pos;
  readonly origin: ChangeOrigin;
  readonly removed?: string[];
  readonly text: string[];

  constructor(options: ChangeBaseOptions) {
    this.from = options.from;
    this.to = options.to;
    this.origin = options.origin;
    this.removed = options.removed;
    this.text = options.text;
  }

  sort() {
    return sortTwoPos(this.from, this.to);
  }
}

type ChangeOptions = ChangeBaseOptions;

export class Change extends ChangeBase {
  constructor(options: ChangeOptions) {
    super(options);
  }

  replace(options: Partial<ChangeOptions>) {
    const { from, to, origin, removed, text } = options;
    return new Change({
      from: isUndefined(from) ? this.from : from,
      to: isUndefined(to) ? this.to : to,
      origin: isUndefined(origin) ? this.origin : origin,
      text: isUndefined(text) ? this.text : text,
      removed: isUndefined(removed) ? this.removed : removed
    });
  }

  toHistoryChange(isSel: boolean = false, dragSelection?: Selection, dragPos?: Pos) {
    if (this.origin === 'drag') {
      if (dragSelection === undefined) {
        throw Error('drag need dragSelection');
      } else if (dragPos === undefined) {
        throw Error('drag need dragPos');
      }
    }
    return new HistoryChange({
      from: this.from,
      to: this.to,
      text: this.text,
      origin: this.origin,
      removed: this.removed,
      isSel,
      dragSelection,
      dragPos
    });
  }
}

interface HistoryChangeOptions extends ChangeBaseOptions {
  isSel: boolean;
  dragSelection?: Selection;
  dragPos?: Pos;
}

export class HistoryChange extends ChangeBase {
  isSel: boolean = false;
  dragSelection?: Selection;
  dragPos?: Pos;

  constructor(options: HistoryChangeOptions) {
    super(options);
    this.isSel = options.isSel;
    this.dragSelection = options.dragSelection;
    this.dragPos = options.dragPos;
  }

  replace(options: Partial<HistoryChange>) {
    const { from, to, origin, removed, text, isSel, dragSelection, dragPos } = options;
    return new HistoryChange({
      from: isUndefined(from) ? this.from : from,
      to: isUndefined(to) ? this.to : to,
      origin: isUndefined(origin) ? this.origin : origin,
      text: isUndefined(text) ? this.text : text,
      removed: isUndefined(removed) ? this.removed : removed,
      isSel: isUndefined(isSel) ? this.isSel : isSel,
      dragSelection: isUndefined(dragSelection) ? this.dragSelection : dragSelection,
      dragPos: isUndefined(dragPos) ? this.dragPos : dragPos
    });
  }

  toChange() {
    return new Change({
      from: this.from,
      to: this.to,
      text: this.text,
      origin: this.origin,
      removed: this.removed
    });
  }
}
