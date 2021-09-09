import { Doc } from './doc';

export class Input {
  ele: HTMLTextAreaElement;
  constructor() {
    this.ele = document.createElement('textarea');
  }

  focus() {
    this.ele.focus();
  }
}
