import { classPrefix } from '../shared/constants';

export class Gutters {
  lineN: number;
  ele: HTMLDivElement;
  constructor(lineN: number) {
    this.lineN = lineN;
    const gutters = document.createElement('div');
    gutters.setAttribute('class', `${classPrefix}_gutters`);
    gutters.append(this.createGutters(lineN));
    this.ele = gutters;
  }

  createGutters(num: number) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < num; i++) {
      fragment.appendChild(this.createGutter(i + 1));
    }
    return fragment;
  }

  createGutter(num: number) {
    const div = document.createElement('div');
    div.setAttribute('class', `${classPrefix}_gutters_item`);
    div.innerText = `${num}`;
    return div;
  }

  updateGutters(lineN: number) {
    let num = this.lineN - lineN;
    if (num > 0) {
      while (num > 0) {
        this.ele.lastChild?.remove();
        num--;
      }
    } else if (num < 0) {
      const fragment = document.createDocumentFragment();
      for (let i = this.lineN + 1; i <= lineN; i++) {
        fragment.appendChild(this.createGutter(i));
      }
      this.ele.append(fragment);
    }
    this.lineN = lineN;
  }
}
