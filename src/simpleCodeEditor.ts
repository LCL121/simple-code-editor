import { Doc } from './doc';
import { Display } from './display';

interface SimpleCodeEditorOptions {
  value: string;
}

class SimpleCodeEditor {
  doc: Doc;
  constructor(options: SimpleCodeEditorOptions) {
    const { value } = options;
    this.doc = new Doc(value);
  }

  render(container: HTMLElement) {
    Display.render(this.doc, container);
  }
}

export default SimpleCodeEditor;
