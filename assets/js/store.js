// Tiny localStorage-backed persistence layer. Everything stays on the user's machine.

const PREFIX = "kwt2026_cat:";

export const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* quota / private mode — fail silently */
    }
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  }
};
