import { Pos } from '../model/pos';
import { classPrefix, lineHeight } from '../shared/constants';

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

  updatePosition(pos: Pos) {
    this.ele.style.transform = `translate(${pos.position.x || 0}px, ${pos.position.y || 0}px)`;
  }
}
