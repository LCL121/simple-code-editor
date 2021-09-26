import { classPrefix, lineHeight } from '../shared/constants';
import { Selection } from '../model/selection';

export class Selected {
  ele: HTMLDivElement;
  private selectedItem = new Map<number, HTMLDivElement>();
  constructor() {
    const selected = document.createElement('div');
    selected.setAttribute('class', `${classPrefix}_selected`);
    this.ele = selected;
  }

  private updateSelectedItem(lineN: number, width: number, options?: { start?: number; end?: number }) {
    const div = this.selectedItem.get(lineN);
    const left = options?.start || 0;
    if (div) {
      div.style.left = `${left}px`;
      div.style.width = options?.end ? `${options.end}px` : `${width - left}px`;
    } else {
      const item = document.createElement('div');
      item.setAttribute('class', `${classPrefix}_selected_item ${classPrefix}_selected_item_focus`);
      item.style.top = `${lineN * lineHeight}px`;
      item.style.left = `${left}px`;
      item.style.width = options?.end ? `${options.end}px` : `${width - left}px`;
      this.selectedItem.set(lineN, item);
      this.ele.append(item);
    }
  }

  clear() {
    this.selectedItem.clear();
  }

  hidden() {
    for (const [key, value] of this.selectedItem) {
      value.style.width = '0px';
    }
  }

  focus() {
    for (const [key, value] of this.selectedItem) {
      value.setAttribute('class', `${classPrefix}_selected_item ${classPrefix}_selected_item_focus`);
    }
  }

  blur() {
    for (const [key, value] of this.selectedItem) {
      value.setAttribute('class', `${classPrefix}_selected_item`);
    }
  }

  update(sel: Selection, width: number) {
    const { startPos, endPos } = sel;
    if (endPos.cmp(startPos) > 0) {
      this.updateSelectedItem(startPos.line, width, { start: startPos.position.x });
      for (let i = startPos.line + 1; i < endPos.line; i++) {
        this.updateSelectedItem(i, width);
      }
      this.updateSelectedItem(endPos.line, width, { end: endPos.position.x });
    }
  }
}
