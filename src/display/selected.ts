import { classPrefix, lineHeight } from '../shared/constants';
import { Selection } from '../model/selection';

export class Selected {
  ele: HTMLDivElement;
  private selectedItem: HTMLDivElement[] = [];
  constructor() {
    const selected = document.createElement('div');
    selected.setAttribute('class', `${classPrefix}_selected`);
    this.ele = selected;
  }

  private getSelectedItem(lineN: number, options?: { start?: number; end?: number }) {
    if (this.selectedItem[lineN]) {
      return this.selectedItem[lineN];
    }
    return this.createSelectedItem(lineN, options);
  }

  private createSelectedItem(lineN: number, options?: { start?: number; end?: number }) {
    const item = document.createElement('div');
    item.setAttribute('class', `${classPrefix}_selected_item ${classPrefix}_selected_item_focus`);
    item.style.top = `${lineN * lineHeight}px`;
    item.style.left = `${options?.start || 0}px`;
    item.style.width = options?.end ? `${options.end}px` : '';
    this.selectedItem.push(item);
    this.ele.append(item);
    return item;
  }

  clearSelectedItem() {
    while (this.selectedItem.length > 0) {
      const item = this.selectedItem.pop();
      item?.remove();
    }
  }

  focus() {
    for (let i = 0; i < this.selectedItem.length; i++) {
      this.selectedItem[i].setAttribute('class', `${classPrefix}_selected_item ${classPrefix}_selected_item_focus`);
    }
  }

  blur() {
    for (let i = 0; i < this.selectedItem.length; i++) {
      this.selectedItem[i].setAttribute('class', `${classPrefix}_selected_item`);
    }
  }

  updateSelectedLines(sel: Selection) {
    const { startPos, endPos } = sel;
    if (endPos.cmp(startPos) > 0) {
      this.getSelectedItem(startPos.line, { start: startPos.position.x });
      for (let i = startPos.line + 1; i < endPos.line; i++) {
        this.getSelectedItem(i);
      }
      this.getSelectedItem(endPos.line, { end: endPos.position.x });
    }
  }
}
