import { Doc } from './model/doc';
import { Display } from './display/display';
import { Input } from './display/input';
import { Cursor } from './display/cursor';
import { Gutters } from './display/gutters';
import { Wrapper } from './display/wrapper';
import { Selected } from './display/selected';

interface SimpleCodeEditorOptions {
  value: string;
}

class SimpleCodeEditor {
  readonly doc: Doc;
  readonly input: Input;
  readonly cursor: Cursor;
  readonly gutters: Gutters;
  readonly wrapper: Wrapper;
  readonly selected: Selected;

  constructor(options: SimpleCodeEditorOptions) {
    const { value } = options;
    this.doc = new Doc(value);
    this.input = new Input();
    this.cursor = new Cursor();
    this.gutters = new Gutters(this.doc.getLinesNum());
    this.wrapper = new Wrapper();
    this.selected = new Selected();
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
}

export default SimpleCodeEditor;
