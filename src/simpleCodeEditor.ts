import { Doc } from './doc';
import { Display } from './display';
import { Input } from './input';
import './styles/index.less';

interface SimpleCodeEditorOptions {
  value: string;
}

class SimpleCodeEditor {
  doc: Doc;
  input: Input;
  constructor(options: SimpleCodeEditorOptions) {
    const { value } = options;
    this.doc = new Doc(value);
    this.input = new Input();
  }

  render(container: HTMLElement) {
    Display.render({
      doc: this.doc,
      input: this.input,
      container
    });
  }
}

export default SimpleCodeEditor;
