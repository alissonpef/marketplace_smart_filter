const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULTS } = require('../src/core/defaults.js');
const Matcher = require('../src/core/matcher.js');

const matches = (query, title, options) =>
  Matcher.matches(Matcher.parseQuery(query), title, options);
const isAccessory = (query, title) => Matcher.isAccessory(Matcher.parseQuery(query), title);

test.beforeEach(() => Matcher.configure(DEFAULTS));

test('accepts listings that contain the model, in any spelling', () => {
  assert.ok(matches('dell g15', 'Notebook gamer Dell G15 RTX 3050'));
  assert.ok(matches('dell g15', 'Dell G-15 5520'));
  assert.ok(matches('dell g15', 'Dell G 15 5520'));
  assert.ok(matches('nitro v15', 'Acer Nitro V 15 i5'));
  assert.ok(matches('rtx 3050', 'Placa RTX3050 6gb'));
});

test('rejects listings from a different brand or model', () => {
  assert.ok(!matches('dell g15', 'Motorola moto G15 256gb'));
  assert.ok(!matches('dell g15', 'Notebook Dell Inspiron 15'));
  assert.ok(!matches('dell g15', 'Vendo moto g15'));
});

test('understands synonyms, plurals and small typos', () => {
  assert.ok(matches('notebook dell', 'Laptop Dell Latitude'));
  assert.ok(matches('inspiron', 'Dell Inspirom 15', { fuzzy: true }));
  assert.ok(!matches('inspiron', 'Dell Inspirom 15', { fuzzy: false }));
});

test('supports exclusions and exact phrases in the query', () => {
  assert.ok(!matches('dell g15 -gamer', 'Dell G15 gamer'));
  assert.ok(matches('"g15 gamer"', 'Dell G15 Gamer'));
  assert.ok(!matches('"g15 gamer"', 'Dell gamer G15'));
});

test('smart mode requires the model but flexes on the other words', () => {
  assert.ok(matches('dell xps 13', 'XPS 13 9310', { matchMode: 'smart' }));
  assert.ok(!matches('dell xps 13', 'Dell Latitude 15', { matchMode: 'smart' }));
});

test('never hides a listing without a readable title', () => {
  assert.ok(matches('dell g15', ''));
});

test('detects accessories unless the query asks for them', () => {
  assert.ok(isAccessory('s25', 'Capinha para Galaxy S25'));
  assert.ok(isAccessory('dell g15', 'Carregador Dell G15 original'));
  assert.ok(!isAccessory('s25', 'Samsung Galaxy S25 Ultra 256gb'));
  assert.ok(!isAccessory('capa s25', 'Capa Galaxy S25'));
});

test('reads descriptions line by line and ignores trade offers', () => {
  const query = Matcher.parseQuery('dell g15');
  const found = (title, description) => Matcher.matchesDescription(query, title, description);
  assert.ok(found('Notebook gamer', 'Vendo meu notebook.\nDell G15 5520, i5, RTX 3050'));
  assert.ok(found('Dell notebook potente', 'Modelo G15 5520'));
  assert.ok(!found('Moto g15 256gb', 'Aceito troca por Dell G15 antigo'));
  assert.ok(!found('Notebook gamer', 'Notebook dell. Tenho também um g15 de celular'));
  assert.ok(!found('Notebook gamer', ''));
  assert.ok(
    !Matcher.matchesDescription(Matcher.parseQuery('dell g15 -gamer'), 'Notebook gamer', 'Dell G15')
  );
});

test('accepts custom synonyms and accessory words', () => {
  Matcher.configure({
    synonymsText: 'tenis = sapatilha\nbike = bicicleta',
    accessoryText: 'cabo, adaptador'
  });
  assert.ok(matches('tenis nike', 'Sapatilha Nike 42'));
  assert.ok(!matches('notebook dell', 'Laptop Dell Latitude'));
  assert.ok(isAccessory('s25', 'Cabo para S25'));
  assert.ok(!isAccessory('s25', 'Capinha para S25'));
});

test('parses the settings text formats', () => {
  assert.deepEqual(Matcher.parseSynonymsText('a = b = c\nsozinho\nx = y z'), [['a', 'b', 'c']]);
  assert.deepEqual(Matcher.parseWordList('Capa, capa\nPelícula'), ['capa', 'pelicula']);
});
