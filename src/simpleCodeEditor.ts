import { Doc } from './model/doc';
import { Display } from './display/display';
import { Input } from './display/input';
import { Cursor } from './display/cursor';
import { Gutters } from './display/gutters';
import { Wrapper } from './display/wrapper';
import { Selected } from './display/selected';
import { OnSave, Mounted, Updated } from './shared/type';
import { classPrefix } from './shared/constants';

interface SimpleCodeEditorOptions {
  value: string;
  mounted?: Mounted;
  updated?: Updated;
  onSave?: OnSave;
}

class SimpleCodeEditor {
  readonly doc: Doc;
  readonly input: Input;
  readonly cursor: Cursor;
  readonly dragCursor: Cursor;
  readonly gutters: Gutters;
  readonly wrapper: Wrapper;
  readonly selected: Selected;

  readonly onSave?: OnSave;
  readonly mounted?: Mounted;
  readonly updated?: Updated;

  private _scrollTop: number = 0;
  private _scrollLeft: number = 0;

  constructor(options: SimpleCodeEditorOptions) {
    const { value, onSave, mounted, updated } = options;
    this.doc = new Doc(value);
    this.input = new Input();
    this.cursor = new Cursor(`${classPrefix}_cursor`);
    this.dragCursor = new Cursor(`${classPrefix}_drag_cursor`);
    this.gutters = new Gutters(this.doc.getLinesNum());
    this.wrapper = new Wrapper();
    this.selected = new Selected();

    this.onSave = onSave;
    this.mounted = mounted;
    this.updated = updated;
  }

  get scrollTop() {
    return this._scrollTop;
  }

  get scrollLeft() {
    return this._scrollLeft;
  }

  render(container: HTMLElement) {
    if (this.doc.init) {
      Display.init(this, container);
    }
  }

  getCode() {
    return this.doc.getCode();
  }

  getSelectedCode() {
    return this.doc.getSelectedCode();
  }

  updateScroll(top: number, left: number) {
    this._scrollTop = top;
    this._scrollLeft = left;
  }
}

export default SimpleCodeEditor;
