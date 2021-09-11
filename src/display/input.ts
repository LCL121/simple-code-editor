import { classPrefix } from '../shared/constants';

export class Input {
  ele: HTMLTextAreaElement;
  constructor() {
    const textarea = document.createElement('textarea');
    textarea.setAttribute('class', `${classPrefix}_textarea`);
    this.ele = textarea;
  }

  focus() {
    this.ele.focus();
  }
}
