import { Pos } from './pos';
import { ChangeOrigin } from './type';

interface ChangeOptions {
  from: Pos;
  to: Pos;
  origin: ChangeOrigin;
  removed: string[];
  text: string[];
}

export class Change {
  from: Pos;
  to: Pos;
  origin: ChangeOrigin;
  removed: string[];
  text: string[];

  constructor(options: ChangeOptions) {
    this.from = options.from;
    this.to = options.to;
    this.origin = options.origin;
    this.removed = options.removed;
    this.text = options.text;
  }
}
