(function (root) {
  'use strict';

  const EMBEDDED_DESCRIPTION =
    /"redacted_description"\s*:\s*\{[^{}]*?"text"\s*:\s*("(?:[^"\\]|\\.)*")/;
  const META_TAG = /<meta\b[^>]*>/gi;
  const OPEN_GRAPH_DESCRIPTION = /(?:property|name)\s*=\s*["']og:description["']/i;
  const CONTENT_ATTRIBUTE = /content\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
  const MAX_LENGTH = 3000;
  const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

  function decodeEntities(text) {
    return text.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
      const name = entity.toLowerCase();
      if (NAMED_ENTITIES[name]) return NAMED_ENTITIES[name];
      const codePoint = name[1] === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    });
  }

  function readEmbeddedDescription(html) {
    const match = EMBEDDED_DESCRIPTION.exec(html);
    if (!match) return '';
    try {
      return String(JSON.parse(match[1])).trim();
    } catch (_) {
      return '';
    }
  }

  function readMetaDescription(html) {
    const tag = (html.match(META_TAG) || []).find((candidate) =>
      OPEN_GRAPH_DESCRIPTION.test(candidate)
    );
    const content = tag && CONTENT_ATTRIBUTE.exec(tag);
    return content ? decodeEntities(content[1] ?? content[2]).trim() : '';
  }

  function parse(html) {
    const embedded = readEmbeddedDescription(html);
    const meta = readMetaDescription(html);
    const parts = [embedded];
    if (meta && !embedded.includes(meta)) parts.push(meta);
    return parts.filter(Boolean).join('\n').slice(0, MAX_LENGTH) || null;
  }

  const api = { parse, decodeEntities };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { DescriptionParser: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
