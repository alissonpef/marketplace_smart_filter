(async function () {
  'use strict';

  const { DEFAULTS } = globalThis.MKF;
  const local = chrome.storage.local;

  const METADATA_SUFFIXES = ['|*', '|@'];
  const DATA_ROWS = [
    { key: 'mkfHidden', label: 'Anúncios ocultados', action: 'Restaurar' },
    { key: 'mkfOpened', label: 'Anúncios já abertos', action: 'Limpar' },
    {
      key: 'mkfListed',
      label: 'Histórico para marcar novos',
      action: 'Limpar',
      ignoreMetadata: true
    },
    { key: 'mkfDescCache', label: 'Descrições guardadas', action: 'Limpar' }
  ];

  const countEntries = (entries, ignoreMetadata) =>
    Object.keys(entries || {}).filter(
      (id) => !(ignoreMetadata && METADATA_SUFFIXES.some((suffix) => id.endsWith(suffix)))
    ).length;

  function createButton(text, onClick, extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `ui-button ${extraClass}`.trim();
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  function createRow(label, control) {
    const row = document.createElement('div');
    row.className = 'ui-row';
    const text = document.createElement('span');
    text.className = 'ui-label';
    text.textContent = label;
    row.append(text, control);
    return row;
  }

  function createEmptyMessage(text) {
    const message = document.createElement('p');
    message.className = 'empty';
    message.textContent = text;
    return message;
  }

  function resetSetting(key) {
    document.querySelector(`textarea[data-setting="${key}"]`).value = DEFAULTS[key];
    chrome.storage.sync.set({ [key]: DEFAULTS[key] });
  }

  async function renderData() {
    const stored = await local.get(null);
    document.getElementById('data').replaceChildren(
      ...DATA_ROWS.map(({ key, label, action, ignoreMetadata }) =>
        createRow(
          `${label}: ${countEntries(stored[key], ignoreMetadata)}`,
          createButton(action, async () => {
            await local.remove(key);
            renderData();
          })
        )
      )
    );

    const profiles = stored.mkfProfiles || {};
    const names = Object.keys(profiles);
    document.getElementById('profiles').replaceChildren(
      ...(names.length
        ? names.map((name) =>
            createRow(
              `"${name}"`,
              createButton(
                'Remover',
                async () => {
                  const { [name]: _removed, ...rest } = profiles;
                  await local.set({ mkfProfiles: rest });
                  renderData();
                },
                'danger'
              )
            )
          )
        : [createEmptyMessage('Nenhum ajuste por busca salvo ainda.')])
    );
  }

  await globalThis.MKF.bindSettings();
  document
    .getElementById('reset-synonyms')
    .addEventListener('click', () => resetSetting('synonymsText'));
  document
    .getElementById('reset-accessories')
    .addEventListener('click', () => resetSetting('accessoryText'));
  document
    .getElementById('open-shortcuts')
    .addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }));
  renderData();
})();
