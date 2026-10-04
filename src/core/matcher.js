(function (root) {
  'use strict';

  const STOPWORDS = new Set([
    'de',
    'da',
    'do',
    'das',
    'dos',
    'para',
    'com',
    'e',
    'a',
    'o',
    'em',
    'um',
    'uma',
    'the',
    'and',
    'of'
  ]);
  const TRADE_OR_COMPATIBILITY = /\b(troc\w*|compativel|compativeis|serve|procuro|compro|aceito)\b/;
  const SEGMENT_SEPARATOR = /[\n\r.!?;|]+/;
  const QUERY_PART = /(-?)"([^"]+)"|(-?)(\S+)/g;
  const FUZZY_MIN_LENGTH = 5;
  const SMART_WORD_QUORUM = 0.5;

  let synonyms = new Map();
  let accessoryWords = new Set();

  const hasDigit = (text) => /\d/.test(text);

  function normalize(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function splitLettersAndDigits(token) {
    return token
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-z])/g, '$1 $2')
      .split(' ');
  }

  function buildIndex(title) {
    const words = normalize(title).split(' ').filter(Boolean);
    const parts = words.flatMap(splitLettersAndDigits);
    const set = new Set([...words, ...parts]);
    for (let size = 2; size <= 3; size++) {
      for (let start = 0; start + size <= parts.length; start++)
        set.add(parts.slice(start, start + size).join(''));
    }
    return {
      set,
      text: ` ${words.join(' ')} `,
      letterWords: [...set].filter((word) => /^[a-z]{4,}$/.test(word))
    };
  }

  function isWithinOneEdit(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
    return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }

  function parseQuery(raw) {
    const parsed = { tokens: [], phrases: [], excluded: [] };
    for (const part of String(raw || '').matchAll(QUERY_PART)) {
      const negative = (part[1] || part[3]) === '-';
      const isPhrase = part[2] !== undefined;
      const text = normalize(isPhrase ? part[2] : part[4]);
      if (!text) continue;
      if (isPhrase) {
        (negative ? parsed.excluded : parsed.phrases).push(text);
      } else if (negative) {
        parsed.excluded.push(text);
      } else {
        text
          .split(' ')
          .filter((word) => hasDigit(word) || !STOPWORDS.has(word))
          .forEach((word) => {
            if (!parsed.tokens.includes(word)) parsed.tokens.push(word);
          });
      }
    }
    return parsed;
  }

  function parseSynonymsText(text) {
    return String(text || '')
      .split('\n')
      .map((line) =>
        line
          .split('=')
          .map(normalize)
          .filter((word) => word && !word.includes(' '))
      )
      .filter((group) => group.length > 1);
  }

  function parseWordList(text) {
    const words = String(text || '')
      .split(/[,\n]+/)
      .map(normalize)
      .filter((word) => word && !word.includes(' '));
    return [...new Set(words)];
  }

  function configure({ synonymsText, accessoryText } = {}) {
    if (synonymsText !== undefined) {
      synonyms = new Map();
      parseSynonymsText(synonymsText).forEach((group) => {
        group.forEach((word) =>
          synonyms.set(
            word,
            group.filter((other) => other !== word)
          )
        );
      });
    }
    if (accessoryText !== undefined) accessoryWords = new Set(parseWordList(accessoryText));
  }

  function tokenMatches(token, index, fuzzy) {
    const { set } = index;
    if (set.has(token)) return true;
    if (token.length > 3 && token.endsWith('s') && set.has(token.slice(0, -1))) return true;
    if (token.length > 2 && set.has(`${token}s`)) return true;
    if ((synonyms.get(token) || []).some((synonym) => set.has(synonym))) return true;
    if (fuzzy && token.length >= FUZZY_MIN_LENGTH && /^[a-z]+$/.test(token)) {
      return index.letterWords.some((word) => isWithinOneEdit(token, word));
    }
    return false;
  }

  function containsExcluded(excluded, index) {
    return excluded.some((term) =>
      term.includes(' ') ? index.text.includes(` ${term} `) : index.set.has(term)
    );
  }

  function satisfiesSmartMode(results) {
    const models = results.filter(({ token }) => hasDigit(token));
    const words = results.filter(({ token }) => !hasDigit(token));
    if (models.some(({ found }) => !found)) return false;
    if (!words.length) return true;
    return words.filter(({ found }) => found).length >= Math.ceil(words.length * SMART_WORD_QUORUM);
  }

  function hitsExclusion(parsed, title) {
    return containsExcluded(parsed.excluded, buildIndex(title));
  }

  function matches(parsed, title, options = {}) {
    const index = buildIndex(title);
    if (!index.text.trim()) return true;
    if (containsExcluded(parsed.excluded, index)) return false;
    if (!parsed.phrases.every((phrase) => index.text.includes(` ${phrase} `))) return false;

    const fuzzy = options.fuzzy !== false;
    const results = parsed.tokens.map((token) => ({
      token,
      found: tokenMatches(token, index, fuzzy)
    }));
    if (!results.length) return true;
    return options.matchMode === 'smart'
      ? satisfiesSmartMode(results)
      : results.every(({ found }) => found);
  }

  function isAccessory(parsed, title) {
    const { set } = buildIndex(title);
    const wanted = new Set(parsed.tokens);
    return [...accessoryWords].some((word) => set.has(word) && !wanted.has(word));
  }

  function matchesDescription(parsed, title, description, options = {}) {
    if (!description || hitsExclusion(parsed, title)) return false;
    const withoutExclusions = { ...parsed, excluded: [] };
    return String(description)
      .split(SEGMENT_SEPARATOR)
      .some((segment) => {
        const text = normalize(segment);
        if (!text || TRADE_OR_COMPATIBILITY.test(text)) return false;
        return matches(withoutExclusions, `${title} ${segment}`, options);
      });
  }

  const api = {
    normalize,
    buildIndex,
    parseQuery,
    matches,
    isAccessory,
    hitsExclusion,
    matchesDescription,
    isWithinOneEdit,
    configure,
    parseSynonymsText,
    parseWordList
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { Matcher: api });

  const defaults = root.MKF && root.MKF.DEFAULTS;
  if (defaults) configure(defaults);
})(typeof globalThis !== 'undefined' ? globalThis : this);
