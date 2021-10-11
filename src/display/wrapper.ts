import { classPrefix } from '../shared/constants';

export class Wrapper {
  readonly ele: HTMLDivElement;
  /** 用于后续监听元素变化 */
  readonly resizeObserver?: ResizeObserver;

  constructor() {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', classPrefix);
    this.ele = wrapper;
  }
}
