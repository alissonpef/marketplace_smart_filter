const test = require('node:test');
const assert = require('node:assert/strict');
const Parser = require('../src/descriptions/parser.js');
const Cache = require('../src/descriptions/cache.js');
const Fetcher = require('../src/descriptions/fetcher.js');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const okResponse = (body = 'nada') => ({
  ok: true,
  status: 200,
  url: 'https://www.facebook.com/marketplace/item/1/',
  text: async () => body
});
const loginResponse = () => ({
  ok: true,
  status: 200,
  url: 'https://www.facebook.com/login/?next=x',
  text: async () => ''
});

test('parser reads the embedded description and the meta description', () => {
  const html = `<meta property="og:description" content="Notebook &amp; cia - Dell G15">
    <script>{"redacted_description":{"text":"Vendo meu notebook.\\nDell G15 5520, i5 12\\u00aa ger."}}</script>`;
  const description = Parser.parse(html);
  assert.ok(description.includes('Dell G15 5520, i5 12ª ger.'));
  assert.ok(description.includes('Notebook & cia'));
});

test('parser returns null when the page has no description', () => {
  assert.equal(Parser.parse('<html>nada</html>'), null);
});

test('parser decodes numeric and named entities', () => {
  assert.equal(Parser.decodeEntities('a &amp; b &#65; &#x42;'), 'a & b A B');
});

test('cache expires old entries and evicts the oldest ones', async () => {
  const store = {};
  let clock = 1000;
  const cache = Cache.create(
    {
      get: async (key) => ({ [key]: store[key] }),
      set: async (values) => Object.assign(store, values)
    },
    { ttlMs: 100, maxEntries: 2, now: () => clock, saveDelayMs: 1 }
  );
  await cache.load();
  cache.set('a', 'x');
  clock++;
  cache.set('b', 'y');
  clock++;
  cache.set('c', 'z');
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.get('c'), 'z');
  clock += 500;
  assert.equal(cache.get('c'), undefined);
  await wait(10);
});

test('fetcher deduplicates ids and respects the session limit', async () => {
  const results = [];
  const fetcher = Fetcher.create({
    fetchFn: async () => okResponse(),
    onResult: (id, description) => results.push([id, description]),
    delayRangeMs: [0, 1],
    maxPerSession: 2,
    sleep: () => Promise.resolve()
  });
  assert.equal(fetcher.enqueue('1', '/marketplace/item/1/'), 'queued');
  assert.equal(fetcher.enqueue('1', '/marketplace/item/1/'), 'duplicate');
  assert.equal(fetcher.enqueue('2', '/marketplace/item/2/'), 'queued');
  assert.equal(fetcher.enqueue('3', '/marketplace/item/3/'), 'full');
  await wait(20);
  assert.deepEqual(results, [
    ['1', null],
    ['2', null]
  ]);
});

test('fetcher pauses when Facebook redirects to login and resumes later', async () => {
  const results = [];
  let attempts = 0;
  const fetcher = Fetcher.create({
    fetchFn: async () => (++attempts === 1 ? loginResponse() : okResponse()),
    onResult: (id) => results.push(id),
    delayRangeMs: [0, 1],
    pauseMs: 20,
    sleep: () => Promise.resolve()
  });
  fetcher.enqueue('9', '/marketplace/item/9/');
  await wait(5);
  assert.equal(fetcher.stats().paused, true);
  await wait(60);
  assert.equal(fetcher.stats().paused, false);
  assert.deepEqual(results, ['9']);
});
