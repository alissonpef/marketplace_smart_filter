(function (root) {
  'use strict';

  const DEFAULT_KEY = 'mkfDescCache';
  const DEFAULT_SAVE_DELAY_MS = 1000;

  function create(
    storage,
    { ttlMs, maxEntries, key = DEFAULT_KEY, now = Date.now, saveDelayMs = DEFAULT_SAVE_DELAY_MS }
  ) {
    let entries = {};
    let saveTimer = null;

    function pruneOldest() {
      const ids = Object.keys(entries);
      if (ids.length <= maxEntries) return;
      ids
        .sort((a, b) => entries[a].savedAt - entries[b].savedAt)
        .slice(0, ids.length - maxEntries)
        .forEach((id) => delete entries[id]);
    }

    function scheduleSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
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
        pruneOldest();
      },
      get(id) {
        const entry = entries[id];
        if (!entry) return undefined;
        if (now() - entry.savedAt > ttlMs) {
          delete entries[id];
          return undefined;
        }
        return entry.description;
      },
      set(id, description) {
        entries[id] = { savedAt: now(), description };
        pruneOldest();
        scheduleSave();
      }
    };
  }

  const api = { create };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { DescriptionCache: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
