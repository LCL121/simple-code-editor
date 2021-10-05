import { emitterEmitUpdate } from '../display/display';

export class Effect<T> {
  private _queue: T[] = [];
  private _timer: number | null = null;

  push(i: T) {
    const idx = this._queue.indexOf(i);
    if (idx !== -1) {
      this._queue.splice(idx, 1);
    }
    this._queue.push(i);

    if (this._timer === null && this._queue.length > 0) {
      this._timer = requestAnimationFrame(() => {
        emitterEmitUpdate();
        this._timer = null;
      });
    }
  }

  shift() {
    if (this._queue.length > 0) {
      return this._queue.shift();
    }
  }

  firstEffect() {
    return this._queue[0];
  }

  lastEffect() {
    return this._queue[this.length() - 1];
  }

  has(i: T) {
    if (this._queue.includes(i)) {
      return true;
    }
    return false;
  }

  length() {
    return this._queue.length;
  }

  clear() {
    while (this._queue.length > 0) {
      this._queue.pop();
    }
  }
}
