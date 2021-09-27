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

  private updateSelectedItem(lineN: number, width: number, options?: { start?: number; end?: number }) {
    const div = this.selectedItem.get(lineN);
    const left = options?.start || 0;
    if (div) {
      div.style.left = `${left}px`;
      div.style.width = options?.end !== undefined ? `${options.end - left}px` : `${width - left}px`;
    } else {
      const item = document.createElement('div');
      item.setAttribute('class', focusClass);
      item.style.top = `${lineN * lineHeight}px`;
      item.style.left = `${left}px`;
      item.style.width = options?.end !== undefined ? `${options.end - left}px` : `${width - left}px`;
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
      if (from.cmpLine(to) !== 0) {
        this.updateSelectedItem(from.line, width, { start: from.position.x });
        for (let i = from.line + 1; i < to.line; i++) {
          this.updateSelectedItem(i, width);
        }
        this.updateSelectedItem(to.line, width, { end: to.position.x });
      } else {
        this.updateSelectedItem(from.line, width, { start: from.position.x, end: to.position.x });
      }
    }
  }
}
