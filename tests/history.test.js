const test = require('node:test');
const assert = require('node:assert/strict');
const History = require('../src/core/history.js');
const Visits = require('../src/content/visits.js');
const Highlight = require('../src/content/highlight.js');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MINUTE = 60 * 1000;

function memoryStorage(initial = {}) {
  const store = { ...initial };
  return {
    store,
    get: async (key) => ({ [key]: store[key] }),
    set: async (values) => Object.assign(store, values)
  };
}

test('history keeps the newest entries and never prunes visit metadata', async () => {
  const storage = memoryStorage({ k: { 'q|*': 5, a: 10 } });
  let clock = 100;
  const history = History.create(storage, 'k', { max: 2, now: () => clock, saveDelayMs: 5 });
  await history.load();
  assert.equal(history.get('a'), 10);
  assert.equal(history.get('constructor'), undefined);

  history.set('b');
  clock++;
  history.set('c');
  clock++;
  history.set('d');
  await wait(30);

  assert.ok(!history.has('a') && !history.has('b'));
  assert.ok(history.has('c') && history.has('d'));
  assert.equal(storage.store.k['q|*'], 5);
  assert.equal(history.size, 2);
});

test('visits: first visit is a baseline, later visits mark only unseen listings as new', () => {
  let clock = 1_000_000;
  const history = History.create(memoryStorage(), 'k', {
    max: 100,
    now: () => clock,
    saveDelayMs: 5
  });
  const visits = Visits.create(history, () => clock);

  visits.begin('dell g15');
  assert.equal(visits.isBaseline, true);
  assert.equal(visits.observe('dell g15', '1'), false);

  clock += 40 * MINUTE;
  visits.begin('dell g15');
  assert.equal(visits.isBaseline, false);
  assert.equal(visits.observe('dell g15', '1'), false);
  assert.equal(visits.observe('dell g15', '2'), true);

  clock += 5 * MINUTE;
  visits.begin('dell g15');
  assert.equal(visits.observe('dell g15', '2'), true, 'stays new during the same visit');
});

test('highlight finds whole-word matches ignoring accents and case', () => {
  assert.deepEqual(Highlight.findRanges('Notebook Dell G15 Gamer', ['dell', 'g15']), [
    [9, 13],
    [14, 17]
  ]);
  assert.deepEqual(Highlight.findRanges('Samsung Galáxy S25 Ultra', ['galaxy', 's25']), [
    [8, 14],
    [15, 18]
  ]);
  assert.deepEqual(Highlight.findRanges('Moto g150', ['g15']), []);
  assert.deepEqual(Highlight.findRanges('dell dell', ['dell', 'dell']), [
    [0, 4],
    [5, 9]
  ]);
});
