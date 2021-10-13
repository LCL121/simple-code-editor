import { classPrefix, lineHeight } from '../shared/constants';
import { Selection } from '../model/selection';
import { Pos } from '../model/pos';

const focusClass = `${classPrefix}_selected_item ${classPrefix}_selected_item_focus`;
const unFocusClass = `${classPrefix}_selected_item`;

export class Selected {
  readonly ele: HTMLDivElement;
  private readonly _selectedItem = new Map<number, HTMLDivElement>();
  private _isHidden: boolean = true;

  constructor() {
    const selected = document.createElement('div');
    selected.setAttribute('class', `${classPrefix}_selected`);
    this.ele = selected;
  }

  get isHidden() {
    return this._isHidden;
  }

  private _updateSelectedItem(lineN: number, options?: { start?: number; end?: number }) {
    const div = this._selectedItem.get(lineN);
    const left = options?.start || 0;
    if (div) {
      div.style.left = `${left}px`;
      div.style.width = options?.end !== undefined ? `${options.end - left}px` : `calc(100% - ${left}px)`;
    } else {
      const item = document.createElement('div');
      item.setAttribute('class', focusClass);
      item.style.top = `${lineN * lineHeight}px`;
      item.style.left = `${left}px`;
      item.style.width = options?.end !== undefined ? `${options.end - left}px` : `calc(100% - ${left}px)`;
      this._selectedItem.set(lineN, item);
      this.ele.append(item);
    }
  }

  clear() {
    this._selectedItem.clear();
  }

  hidden() {
    this._isHidden = true;
    for (const [key, value] of this._selectedItem) {
      value.style.width = '0px';
    }
  }

  focus() {
    for (const [key, value] of this._selectedItem) {
      value.setAttribute('class', focusClass);
    }
  }

  blur() {
    for (const [key, value] of this._selectedItem) {
      value.setAttribute('class', unFocusClass);
    }
  }

  update(sel: Selection, isHidden = true) {
    const { from, to, equal } = sel.sort();
    if (isHidden) {
      this.hidden();
    }
    if (!equal) {
      if (from.cmpLine(to) !== 0) {
        this._updateSelectedItem(from.line, { start: from.position.x });
        for (let i = from.line + 1; i < to.line; i++) {
          this._updateSelectedItem(i);
        }
        this._updateSelectedItem(to.line, { end: to.position.x });
      } else {
        this._updateSelectedItem(from.line, { start: from.position.x, end: to.position.x });
      }
      this._isHidden = false;
    }
  }
}
