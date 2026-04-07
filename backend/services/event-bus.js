const EventEmitter = require("events");

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  emitEvent(event, payload) {
    this.emit(event, payload);
  }

  onEvent(event, listener) {
    this.on(event, listener);
  }
}

module.exports = new EventBus();
