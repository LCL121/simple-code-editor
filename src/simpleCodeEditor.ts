import { Doc } from './model/doc';
import { Display } from './display/display';
import { Input } from './display/input';
import { Cursor } from './display/cursor';
import './styles/index.less';

interface SimpleCodeEditorOptions {
  value: string;
}

class SimpleCodeEditor {
  private doc: Doc;
  private input: Input;
  private cursor: Cursor;
  constructor(options: SimpleCodeEditorOptions) {
    const { value } = options;
    this.doc = new Doc(value);
    this.input = new Input();
    this.cursor = new Cursor();
  }

  render(container: HTMLElement) {
    if (this.doc.init) {
      Display.init({
        doc: this.doc,
        input: this.input,
        cursor: this.cursor,
        container
      });
    }
  }

  getCode() {
    return this.doc.getCode();
  }
}

export default SimpleCodeEditor;
