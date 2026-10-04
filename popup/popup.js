(async function () {
  'use strict';

  await globalThis.MKF.bindSettings();
  document.getElementById('version').textContent = `v${chrome.runtime.getManifest().version}`;
  document
    .getElementById('open-options')
    .addEventListener('click', () => chrome.runtime.openOptionsPage());
})();
