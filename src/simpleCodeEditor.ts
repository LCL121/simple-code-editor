import { Doc } from './model/doc';
import { Display } from './display/display';
import { Input } from './display/input';
import { Cursor } from './display/cursor';
import { Gutters } from './display/gutters';
import { Wrapper } from './display/wrapper';
import { Selected } from './display/selected';
import { OnSave, Mounted, Updated, Reset } from './shared/type';
import { classPrefix } from './shared/constants';

interface SimpleCodeEditorOptions {
  value: string;
  mounted?: Mounted;
  reset?: Reset;
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
  readonly reset?: Reset;

  private _scrollTop: number = 0;
  private _scrollLeft: number = 0;

  private _container?: HTMLElement;

  constructor(options: SimpleCodeEditorOptions) {
    const { value, onSave, mounted, updated, reset } = options;
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
    this.reset = reset;
  }

  get scrollTop() {
    return this._scrollTop;
  }

  get scrollLeft() {
    return this._scrollLeft;
  }

  render(container: HTMLElement) {
    this._container = container;

    if (this.doc.init) {
      Display.init(this, container);
    }
  }

  resetValue(value: string) {
    this.doc.resetValue(value);
    this.gutters.updateGutters(this.doc.getLinesNum());

    Display.reset(this, this._container!);
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
