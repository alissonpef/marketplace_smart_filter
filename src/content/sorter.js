(function (root) {
  'use strict';

  const ORDERABLE_DISPLAY = /grid|flex/;

  const canOrderChildren = (parent) => ORDERABLE_DISPLAY.test(getComputedStyle(parent).display);
  const pricedOrNull = (entry) => (entry.card.price > 0 ? entry.card.price : null);

  function compareByPrice(direction) {
    return (a, b) => {
      const priceA = pricedOrNull(a);
      const priceB = pricedOrNull(b);
      if (priceA === null || priceB === null)
        return Number(priceA === null) - Number(priceB === null);
      return (priceA - priceB) * direction;
    };
  }

  function groupByParent(entries) {
    const groups = new Map();
    entries.forEach((entry) => {
      const parent = entry.el.parentElement;
      if (!parent) return;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(entry);
    });
    return groups;
  }

  function create() {
    const ordered = new Set();

    function reset() {
      ordered.forEach((element) => {
        element.style.order = '';
      });
      ordered.clear();
    }

    function apply(entries, { active, mode }) {
      const groups = groupByParent(entries);
      const supported = groups.size === 0 || [...groups.keys()].some(canOrderChildren);
      if (!active || mode === 'original') {
        reset();
        return supported;
      }

      const nextOrdered = new Set();
      const direction = mode === 'asc' ? 1 : -1;
      groups.forEach((items, parent) => {
        if (!canOrderChildren(parent)) return;
        const matched = items.filter((entry) => entry.verdict.ok).sort(compareByPrice(direction));
        const rejected = items.filter((entry) => !entry.verdict.ok);
        [...matched, ...rejected].forEach((entry, position) => {
          const newOrder = String(position + 1);
          if (entry.el.style.order !== newOrder) entry.el.style.order = newOrder;
          nextOrdered.add(entry.el);
        });
      });

      ordered.forEach((element) => {
        if (!nextOrdered.has(element)) element.style.order = '';
      });
      ordered.clear();
      nextOrdered.forEach((element) => ordered.add(element));

      return supported;
    }

    return { apply, reset };
  }

  const api = { create };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { Sorter: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
