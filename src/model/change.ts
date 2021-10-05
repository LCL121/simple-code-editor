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
  from: Pos;
  to: Pos;
  origin: ChangeOrigin;
  removed?: string[];
  text: string[];

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
      text: text || this.text
    });
  }
}
