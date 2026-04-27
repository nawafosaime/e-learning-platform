export class EventBus extends EventTarget {
  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail }));
  }

  on(name, callback) {
    this.addEventListener(name, callback);
  }
}
