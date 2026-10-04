(function (root) {
  'use strict';

  const NAME = 'mkf-term';

  function fold(text) {
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const f = text[i].normalize('NFD')[0].toLowerCase();
      out += f.length === 1 ? f : text[i];
    }
    return out;
  }

  const isAlnum = (c) => Boolean(c) && /[a-z0-9]/.test(c);

  function findRanges(text, tokens) {
    const folded = fold(text);
    const ranges = [];
    tokens.forEach((tok) => {
      if (!tok) return;
      let from = 0,
        i;
      while ((i = folded.indexOf(tok, from)) >= 0) {
        if (!isAlnum(folded[i - 1]) && !isAlnum(folded[i + tok.length]))
          ranges.push([i, i + tok.length]);
        from = i + tok.length;
      }
    });
    ranges.sort((a, b) => a[0] - b[0]);
    return ranges.reduce((acc, r) => {
      const last = acc[acc.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else acc.push([...r]);
      return acc;
    }, []);
  }

  const supported = () =>
    typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';

  function clear() {
    if (supported()) CSS.highlights.delete(NAME);
  }

  function paint(nodeLists, tokens) {
    if (!supported()) return;
    if (!tokens.length) {
      clear();
      return;
    }
    const ranges = [];
    nodeLists.forEach((nodes) =>
      nodes.forEach((node) => {
        if (!node.isConnected) return;
        findRanges(node.nodeValue, tokens).forEach(([s, e]) => {
          const r = document.createRange();
          r.setStart(node, s);
          r.setEnd(node, e);
          ranges.push(r);
        });
      })
    );
    CSS.highlights.set(NAME, new Highlight(...ranges));
  }

  const api = { findRanges, paint, clear };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { Highlight: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
