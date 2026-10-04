(function (root) {
  'use strict';

  const BRAZILIAN_PRICE = /^(?:r\$|\$)\s*([\d.]+(?:,\d{1,2})?)$/i;
  const SUSPICIOUS_RATIO = 0.5;
  const MIN_SAMPLE_SIZE = 5;

  function parse(text) {
    const match = BRAZILIAN_PRICE.exec(String(text || '').trim());
    if (!match) return null;
    return Number(match[1].replace(/\./g, '').replace(',', '.'));
  }

  function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function isSuspicious(price, medianPrice, sampleSize) {
    return (
      sampleSize >= MIN_SAMPLE_SIZE &&
      medianPrice > 0 &&
      price > 0 &&
      price < medianPrice * SUSPICIOUS_RATIO
    );
  }

  const api = { parse, median, isSuspicious };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { Price: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
