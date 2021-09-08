import { Doc } from './doc';

export class Input {
  ele: HTMLTextAreaElement;
  constructor() {
    this.ele = document.createElement('textarea');
  }

  init(container: HTMLElement, doc: Doc) {
    container.appendChild(this.ele);
    doc.ele?.addEventListener('click', () => {
      this.focus();
    });
    this.ele.addEventListener('input', (e) => {
      console.log(e);
      doc.updateDoc();
    });
    this.ele.addEventListener('copy', (e) => {
      console.log(e);
    });
  }

  focus() {
    this.ele.focus();
  }
}
