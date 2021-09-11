import { Doc } from './model/doc';
import { Display } from './display/display';
import { Input } from './display/input';
import { Cursor } from './display/cursor';
import { Gutters } from './display/gutters';
import { Wrapper } from './display/wrapper';
import './styles/index.less';

interface SimpleCodeEditorOptions {
  value: string;
}

class SimpleCodeEditor {
  doc: Doc;
  input: Input;
  cursor: Cursor;
  gutters: Gutters;
  wrapper: Wrapper;
  constructor(options: SimpleCodeEditorOptions) {
    const { value } = options;
    this.doc = new Doc(value);
    this.input = new Input();
    this.cursor = new Cursor();
    this.gutters = new Gutters(this.doc.getLinesNum());
    this.wrapper = new Wrapper();
  }

  render(container: HTMLElement) {
    if (this.doc.init) {
      Display.init(this, container);
    }
  }

  getCode() {
    return this.doc.getCode();
  }
}

export default SimpleCodeEditor;
