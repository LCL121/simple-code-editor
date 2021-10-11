import { Pos, sortTwoPos } from './pos';
import { ChangeOrigin } from '../shared/constants';

interface ChangeOptions {
  from: Pos;
  to: Pos;
  origin: ChangeOrigin;
  removed?: string[];
  text: string[];
}

export class Change {
  readonly from: Pos;
  readonly to: Pos;
  readonly origin: ChangeOrigin;
  readonly removed?: string[];
  readonly text: string[];

  constructor(options: ChangeOptions) {
    this.from = options.from;
    this.to = options.to;
    this.origin = options.origin;
    this.removed = options.removed;
    this.text = options.text;
  }

  sort() {
    return sortTwoPos(this.from, this.to);
  }

  replace(options: Partial<ChangeOptions>) {
    const { from, to, origin, removed, text } = options;
    return new Change({
      from: from || this.from,
      to: to || this.to,
      origin: origin || this.origin,
      text: text || this.text,
      removed: removed || this.removed
    });
  }

  toHistoryChange(isSel: boolean = false) {
    return new HistoryChange({
      from: this.from,
      to: this.to,
      text: this.text,
      origin: this.origin,
      removed: this.removed,
      isSel: isSel
    });
  }
}

interface HistoryChangeOptions extends ChangeOptions {
  isSel: boolean;
}

export class HistoryChange extends Change {
  isSel: boolean = false;

  constructor(options: HistoryChangeOptions) {
    super(options);
    this.isSel = options.isSel;
  }

  replace(options: Partial<HistoryChange>) {
    const { from, to, origin, removed, text, isSel } = options;
    return new HistoryChange({
      from: from || this.from,
      to: to || this.to,
      origin: origin || this.origin,
      text: text || this.text,
      removed: removed || this.removed,
      isSel: isSel || this.isSel
    });
  }
}
