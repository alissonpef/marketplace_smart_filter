(function (root) {
  'use strict';

  const ITEM_SELECTOR = 'a[href*="/marketplace/item/"]';
  const PRICE_TEXT = /^(?:(?:r\$|\$)\s*[\d.,]+|gratuito|free)$/i;
  const LOCATION_TEXT = /,\s*[A-Z]{2}$/;
  const MAX_CONTAINER_DEPTH = 10;
  const MAX_ANCESTOR_LOOKUP = 20;
  const VIEWPORT_MARGIN_ABOVE = 300;
  const VIEWPORT_MARGIN_BELOW = 600;

  function getSearchQuery() {
    try {
      return new URL(location.href).searchParams.get('query') || '';
    } catch (_) {
      return '';
    }
  }

  const itemIdFromHref = (href) => (/\/item\/(\d+)/.exec(href || '') || [])[1];

  function findCardContainer(anchor, id) {
    let node = anchor;
    for (let depth = 0; depth < MAX_CONTAINER_DEPTH; depth++) {
      const parent = node.parentElement;
      if (!parent || parent === document.body) break;
      const holdsAnotherItem = [...parent.querySelectorAll(ITEM_SELECTOR)].some(
        (other) => itemIdFromHref(other.getAttribute('href')) !== id
      );
      if (holdsAnotherItem) return node;
      node = parent;
    }
    return node === document.body ? anchor : node;
  }

  function readCard(anchor) {
    const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);
    const titleNodes = [];
    let price = null;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.nodeValue.trim();
      if (!text) continue;
      if (PRICE_TEXT.test(text)) {
        if (price === null) price = root.MKF.Price.parse(text);
      } else if (!LOCATION_TEXT.test(text)) {
        titleNodes.push(node);
      }
    }
    return { title: titleNodes.map((node) => node.nodeValue.trim()).join(' '), price, titleNodes };
  }

  function isNearViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.bottom > -VIEWPORT_MARGIN_ABOVE && rect.top < window.innerHeight + VIEWPORT_MARGIN_BELOW
    );
  }

  function findTrackedAncestor(target, trackedElements) {
    let node = target instanceof Element ? target : null;
    for (let depth = 0; node && depth < MAX_ANCESTOR_LOOKUP; depth++, node = node.parentElement) {
      if (trackedElements.has(node)) return node;
    }
    return null;
  }

  const api = {
    ITEM_SELECTOR,
    getSearchQuery,
    itemIdFromHref,
    findCardContainer,
    readCard,
    isNearViewport,
    findTrackedAncestor
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { Dom: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
