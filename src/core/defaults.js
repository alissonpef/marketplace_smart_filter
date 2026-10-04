(function (root) {
  'use strict';

  const SYNONYMS_TEXT = [
    'notebook = laptop',
    'celular = smartphone',
    'geladeira = refrigerador',
    'bicicleta = bike',
    'televisao = tv'
  ].join('\n');

  const ACCESSORY_TEXT =
    'capa, capas, capinha, capinhas, case, cases, bumper, pelicula, peliculas, protetor, ' +
    'carregador, cabo, suporte, adaptador, pecas, peca, sucata, kit';

  const DEFAULTS = Object.freeze({
    enabled: true,
    action: 'dim',
    matchMode: 'all',
    fuzzy: true,
    filterAccessories: true,
    searchDescriptions: false,
    flagLowPrice: true,
    highlightGood: true,
    highlightTerms: true,
    markNew: true,
    onlyNew: false,
    dimSeen: true,
    sortMode: 'original',
    showPanel: true,
    panelOpen: false,
    theme: 'auto',
    excludeWords: '',
    synonymsText: SYNONYMS_TEXT,
    accessoryText: ACCESSORY_TEXT
  });

  const api = { DEFAULTS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MKF = Object.assign(root.MKF || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
