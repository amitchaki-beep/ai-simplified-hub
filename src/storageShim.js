/**
 * Replaces Claude artifact's built-in window.storage API with a version
 * backed by the browser's localStorage, so the app's existing storage
 * calls work unchanged on real hosting (Vercel, Netlify, etc.).
 * Each student's browser keeps its own progress, quiz scores, and session.
 */
const PREFIX = "aish_"; // ai-simplified-hub namespace, avoids clashing with other localStorage use

window.storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(PREFIX + (shared ? "shared_" : "") + key);
    if (raw === null) throw new Error(`Key not found: ${key}`);
    return { key, value: raw, shared };
  },
  async set(key, value, shared = false) {
    localStorage.setItem(PREFIX + (shared ? "shared_" : "") + key, value);
    return { key, value, shared };
  },
  async delete(key, shared = false) {
    localStorage.removeItem(PREFIX + (shared ? "shared_" : "") + key);
    return { key, deleted: true, shared };
  },
  async list(prefix = "", shared = false) {
    const scope = PREFIX + (shared ? "shared_" : "");
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(scope + prefix))
      .map((k) => k.slice(scope.length));
    return { keys, prefix, shared };
  },
};
