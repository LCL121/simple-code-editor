import { Pos } from '../model/pos';
import { classPrefix } from '../shared/constants';

export class Cursor {
  readonly ele: HTMLDivElement;

  constructor() {
    const div = document.createElement('div');
    div.setAttribute('class', `${classPrefix}_cursor`);
    div.style.display = 'none';
    this.ele = div;
  }

  updatePosition(pos: Pos) {
    this.ele.style.transform = `translate(${pos.position.x || 0}px, ${pos.position.y || 0}px)`;
  }

  hidden() {
    this.ele.style.display = 'none';
  }

  show() {
    this.ele.style.display = 'block';
  }
}
