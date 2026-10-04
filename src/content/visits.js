(function (root) {
  'use strict';

  const VISIT_GAP_MS = 30 * 60 * 1000;
  const TOUCH_INTERVAL_MS = 15 * 1000;
  const BASELINE = Number.MAX_SAFE_INTEGER;

  const lastActivityKey = (queryKey) => `${queryKey}|*`;
  const visitStartKey = (queryKey) => `${queryKey}|@`;

  function create(history, now = Date.now) {
    let visitStart = BASELINE;
    let lastTouch = 0;

    function begin(queryKey) {
      const current = now();
      const lastActivity = history.get(lastActivityKey(queryKey));
      if (lastActivity === undefined) visitStart = BASELINE;
      else if (current - lastActivity > VISIT_GAP_MS) visitStart = current;
      else visitStart = history.get(visitStartKey(queryKey)) ?? current;
      history.set(visitStartKey(queryKey), visitStart);
      history.set(lastActivityKey(queryKey), current);
      lastTouch = current;
    }

    function touch(queryKey) {
      const current = now();
      if (current - lastTouch <= TOUCH_INTERVAL_MS) return;
      history.set(lastActivityKey(queryKey), current);
      lastTouch = current;
    }

    function observe(queryKey, id) {
      const key = `${queryKey}|${id}`;
      const firstSeen = history.get(key);
      if (firstSeen === undefined) {
        history.set(key, now());
        return visitStart !== BASELINE;
      }
      return firstSeen >= visitStart;
    }

    return {
      begin,
      touch,
      observe,
      get isBaseline() {
        return visitStart === BASELINE;
      }
    };
  }

  const api = { create };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { Visits: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
