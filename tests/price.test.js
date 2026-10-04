const test = require('node:test');
const assert = require('node:assert/strict');
const Price = require('../src/core/price.js');

test('parses Brazilian prices', () => {
  assert.equal(Price.parse('R$4.200'), 4200);
  assert.equal(Price.parse('R$ 1.234,50'), 1234.5);
  assert.equal(Price.parse('R$550'), 550);
  assert.equal(Price.parse('Gratuito'), null);
});

test('computes the median of odd and even samples', () => {
  assert.equal(Price.median([3000, 3200, 3100, 3300, 3000, 400]), 3050);
  assert.equal(Price.median([5, 1, 3]), 3);
  assert.equal(Price.median([]), null);
});

test('flags prices far below the median only with enough samples', () => {
  assert.ok(Price.isSuspicious(400, 3050, 6));
  assert.ok(!Price.isSuspicious(400, 3050, 3));
  assert.ok(!Price.isSuspicious(2000, 3050, 6));
});
