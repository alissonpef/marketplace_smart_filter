(function (root) {
  'use strict';

  const DARK_LUMINANCE_LIMIT = 110;

  function luminanceOf(cssColor) {
    const channels = (cssColor || '').match(/\d+/g);
    if (!channels || channels[3] === '0') return null;
    const [red, green, blue] = channels.map(Number);
    return 0.299 * red + 0.587 * green + 0.114 * blue;
  }

  function resolve(preference) {
    if (preference !== 'auto') return preference;
    const classes = document.documentElement.classList;
    if (classes.contains('__fb-dark-mode')) return 'dark';
    if (classes.contains('__fb-light-mode')) return 'light';
    const luminance = luminanceOf(getComputedStyle(document.body).backgroundColor);
    return luminance !== null && luminance < DARK_LUMINANCE_LIMIT ? 'dark' : 'light';
  }

  const api = { resolve };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { Theme: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
