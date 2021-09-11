import { classPrefix } from '../shared/constants';

export class Cursor {
  ele: HTMLDivElement;
  constructor() {
    const div = document.createElement('div');
    div.setAttribute('class', `${classPrefix}_cursor`);
    div.style.display = 'none';
    this.ele = div;
  }

  updatePosition(x: number, y: number) {
    this.ele.style.transform = `translate(${x}px, ${y}px)`;
  }

  hidden() {
    this.ele.style.display = 'none';
  }

  show() {
    this.ele.style.display = 'block';
  }
}
