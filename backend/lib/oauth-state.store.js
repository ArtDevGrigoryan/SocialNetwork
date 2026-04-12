const crypto = require("crypto");

class OAuthStateStore {
  constructor() {
    this.store = new Map();
  }

  generate() {
    const state = crypto.randomBytes(16).toString("hex");
    this.store.set(state, true);
    return state;
  }

  validate(state) {
    if (!this.store.has(state)) {
      throw new Error("Invalid OAuth state");
    }
    this.store.delete(state);
  }
}

module.exports = new OAuthStateStore();
