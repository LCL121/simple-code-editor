import { classPrefix } from '../shared/constants';

export class Gutters {
  lineNum: number;
  ele: HTMLDivElement;
  constructor(lineNum: number) {
    this.lineNum = lineNum;
    const gutters = document.createElement('div');
    gutters.setAttribute('class', `${classPrefix}_gutters`);
    gutters.append(this._createGutters(lineNum));
    this.ele = gutters;
  }

  private _createGutters(num: number) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < num; i++) {
      fragment.appendChild(this._createGutter(i + 1));
    }
    return fragment;
  }

  private _createGutter(num: number) {
    const div = document.createElement('div');
    div.setAttribute('class', `${classPrefix}_gutters_item`);
    div.innerText = `${num}`;
    return div;
  }

  updateGutters(lineNum: number) {
    let num = this.lineNum - lineNum;
    if (num > 0) {
      while (num > 0) {
        this.ele.lastChild?.remove();
        num--;
      }
    } else if (num < 0) {
      const fragment = document.createDocumentFragment();
      for (let i = this.lineNum + 1; i <= lineNum; i++) {
        fragment.appendChild(this._createGutter(i));
      }
      this.ele.append(fragment);
    }
    this.lineNum = lineNum;
  }
}
