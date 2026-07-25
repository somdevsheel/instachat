const listeners = new Map();

const feedEvents = {
  on(event, callback) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(callback);
  },

  off(event, callback) {
    if (!listeners.has(event)) return;
    listeners.get(event).delete(callback);
  },

  emit(event, payload) {
    if (!listeners.has(event)) return;
    listeners.get(event).forEach(cb => cb(payload));
  },
};

export default feedEvents;
