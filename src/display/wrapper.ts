import { classPrefix } from '../shared/constants';

export class Wrapper {
  ele: HTMLDivElement;
  constructor() {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', classPrefix);
    this.ele = wrapper;
  }
}
