import { Doc } from './model/doc';
import { Display } from './display/display';
import { Input } from './display/input';
import './styles/index.less';

interface SimpleCodeEditorOptions {
  value: string;
}

class SimpleCodeEditor {
  private doc: Doc;
  private input: Input;
  constructor(options: SimpleCodeEditorOptions) {
    const { value } = options;
    this.doc = new Doc(value);
    this.input = new Input();
  }

  render(container: HTMLElement) {
    if (this.doc.init) {
      Display.init({
        doc: this.doc,
        input: this.input,
        container
      });
    }
  }

  getCode() {
    return this.doc.getCode();
  }
}

export default SimpleCodeEditor;
