import { classPrefix, lineHeight } from '../shared/constants';
import { Selection } from '../model/selection';
import { Pos } from '../model/pos';

const focusClass = `${classPrefix}_selected_item ${classPrefix}_selected_item_focus`;
const unFocusClass = `${classPrefix}_selected_item`;

export class Selected {
  ele: HTMLDivElement;
  private selectedItem = new Map<number, HTMLDivElement>();
  constructor() {
    const selected = document.createElement('div');
    selected.setAttribute('class', `${classPrefix}_selected`);
    this.ele = selected;
  }

  private updateSelected(startPos: Pos, endPos: Pos, width: number) {
    if (startPos.cmpLine(endPos) !== 0) {
      this.updateSelectedItem(startPos.line, width, { start: startPos.position.x });
      for (let i = startPos.line + 1; i < endPos.line; i++) {
        this.updateSelectedItem(i, width);
      }
      this.updateSelectedItem(endPos.line, width, { end: endPos.position.x });
    } else {
      this.updateSelectedItem(startPos.line, width, { start: startPos.position.x, end: endPos.position.x });
    }
  }

  private updateSelectedItem(lineN: number, width: number, options?: { start?: number; end?: number }) {
    const div = this.selectedItem.get(lineN);
    const left = options?.start || 0;
    if (div) {
      div.style.left = `${left}px`;
      div.style.width = options?.end ? `${options.end - left}px` : `${width - left}px`;
    } else {
      const item = document.createElement('div');
      item.setAttribute('class', focusClass);
      item.style.top = `${lineN * lineHeight}px`;
      item.style.left = `${left}px`;
      item.style.width = options?.end ? `${options.end - left}px` : `${width - left}px`;
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
      value.setAttribute('class', focusClass);
    }
  }

  blur() {
    for (const [key, value] of this.selectedItem) {
      value.setAttribute('class', unFocusClass);
    }
  }

  update(sel: Selection, width: number) {
    const { from, to, equal } = sel.sort();
    this.hidden();
    if (!equal) {
      this.updateSelected(from, to, width);
    }
  }
}
