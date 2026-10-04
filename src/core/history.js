(function (root) {
  'use strict';

  const DEFAULT_SAVE_DELAY_MS = 1000;
  const isMetadataKey = (key) => key.endsWith('|*') || key.endsWith('|@');
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  function create(storage, key, { max, now = Date.now, saveDelayMs = DEFAULT_SAVE_DELAY_MS }) {
    let entries = {};
    let saveTimer = null;

    function pruneOldest() {
      const ids = Object.keys(entries).filter((id) => !isMetadataKey(id));
      if (ids.length <= max) return;
      ids
        .sort((a, b) => entries[a] - entries[b])
        .slice(0, ids.length - max)
        .forEach((id) => delete entries[id]);
    }

    function scheduleSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        pruneOldest();
        Promise.resolve(storage.set({ [key]: entries })).catch(() => {});
      }, saveDelayMs);
    }

    return {
      async load() {
        try {
          const stored = await storage.get(key);
          entries = (stored && stored[key]) || {};
        } catch (_) {
          entries = {};
        }
      },
      get: (id) => (hasOwn(entries, id) ? entries[id] : undefined),
      has: (id) => hasOwn(entries, id),
      set(id, timestamp = now()) {
        entries[id] = timestamp;
        scheduleSave();
      },
      delete(id) {
        delete entries[id];
        scheduleSave();
      },
      clear() {
        entries = {};
        scheduleSave();
      },
      get size() {
        return Object.keys(entries).filter((id) => !isMetadataKey(id)).length;
      }
    };
  }

  const api = { create };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { History: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
