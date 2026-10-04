(function () {
  'use strict';

  const { DEFAULTS } = globalThis.MKF;
  const TEXT_INPUT_DEBOUNCE_MS = 250;

  function applyTheme(theme) {
    document
      .querySelectorAll('.ui-root')
      .forEach((root) => root.setAttribute('data-theme', theme || 'auto'));
  }

  function paint(element, value) {
    if (element.matches('.ui-switch')) {
      element.setAttribute('aria-checked', String(Boolean(value)));
    } else if (element.matches('.ui-seg')) {
      element.querySelectorAll('button').forEach((button) => {
        button.setAttribute('aria-checked', String(button.dataset.value === value));
      });
    } else if (document.activeElement !== element) {
      element.value = value ?? '';
    }
  }

  function listen(element, save) {
    if (element.matches('.ui-switch')) {
      element.addEventListener('click', () =>
        save(element.getAttribute('aria-checked') !== 'true')
      );
    } else if (element.matches('.ui-seg')) {
      element.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-value]');
        if (button) save(button.dataset.value);
      });
    } else {
      let timer;
      element.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => save(element.value), TEXT_INPUT_DEBOUNCE_MS);
      });
    }
  }

  async function bindSettings() {
    const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
    const elements = [...document.querySelectorAll('[data-setting]')];

    applyTheme(settings.theme);
    elements.forEach((element) => {
      const key = element.dataset.setting;
      paint(element, settings[key]);
      listen(element, (value) => {
        paint(element, value);
        settings[key] = value;
        chrome.storage.sync.set({ [key]: value });
        if (key === 'theme') applyTheme(value);
      });
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      elements.forEach((element) => {
        const key = element.dataset.setting;
        if (key in changes) paint(element, changes[key].newValue);
      });
      if (changes.theme) applyTheme(changes.theme.newValue);
    });
  }

  globalThis.MKF.bindSettings = bindSettings;
})();
