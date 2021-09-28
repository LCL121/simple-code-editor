import { emitterEmitUpdate } from '../display/display';

export class Effect<T> {
  private queue: T[] = [];
  private timer: number | null = null;

  push(i: T) {
    const idx = this.queue.indexOf(i);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
    }
    this.queue.push(i);

    if (this.timer === null && this.queue.length > 0) {
      this.timer = requestAnimationFrame(() => {
        emitterEmitUpdate();
        this.timer = null;
      });
    }
  }

  shift() {
    if (this.queue.length > 0) {
      return this.queue.shift();
    }
  }

  firstEffect() {
    return this.queue[0];
  }

  lastEffect() {
    return this.queue[this.length() - 1];
  }

  has(i: T) {
    if (this.queue.includes(i)) {
      return true;
    }
    return false;
  }

  length() {
    return this.queue.length;
  }

  clear() {
    while (this.queue.length > 0) {
      this.queue.pop();
    }
  }
}
