(function () {
  'use strict';

  const {
    DEFAULTS,
    Matcher,
    Price,
    History,
    DescriptionCache,
    DescriptionFetcher,
    Dom,
    Visits,
    Sorter,
    Theme,
    Highlight,
    Panel
  } = globalThis.MKF;

  const LOG_PREFIX = '[Marketplace Smart Filter]';
  const DEBOUNCE_MS = 150;
  const URL_POLL_MS = 1000;
  const DESCRIPTION_TTL_MS = 3 * 24 * 60 * 60 * 1000;
  const DESCRIPTION_CACHE_SIZE = 500;
  const HISTORY_LIMITS = { listed: 6000, opened: 2000, hidden: 1000 };
  const PROFILE_FIELDS = ['matchMode', 'filterAccessories', 'searchDescriptions'];
  const STYLE_FILES = ['ui/tokens.css', 'ui/components.css', 'ui/panel.css'];
  const CARD_CLASSES = [
    'mkf-dim',
    'mkf-hide',
    'mkf-hidden',
    'mkf-good',
    'mkf-desc',
    'mkf-new',
    'mkf-suspect',
    'mkf-seen',
    'mkf-rel'
  ];
  const CARD_ATTRIBUTES = ['data-mkf-tag', 'data-mkf-note'];
  const REJECTED = Object.freeze({ ok: false });

  let settings = { ...DEFAULTS };
  let profiles = {};
  let config = settings;
  let query = null;
  let queryKey = '';
  let parsedQuery = null;
  let refreshTimer = null;
  let lastHref = location.href;
  let configVersion = 0;
  let missingDescriptionLogs = 5;

  let panel = null;
  let fetcher = null;
  let descriptionCache = null;
  let listed = null;
  let opened = null;
  let hidden = null;
  let visits = null;

  const sorter = Sorter.create();
  const cards = new Map();
  const cardsById = new Map();
  let readAnchors = new WeakMap();

  const isFilterActive = () =>
    Boolean(
      config.enabled && parsedQuery && (parsedQuery.tokens.length || parsedQuery.phrases.length)
    );

  function computeConfig() {
    const profile = profiles[queryKey] || {};
    config = { ...settings };
    PROFILE_FIELDS.forEach((field) => {
      if (profile[field] !== undefined) config[field] = profile[field];
    });
  }

  function parseCurrentQuery() {
    const parsed = Matcher.parseQuery(query);
    const profileWords = (profiles[queryKey] && profiles[queryKey].excludeWords) || '';
    `${settings.excludeWords},${profileWords}`
      .split(',')
      .map(Matcher.normalize)
      .filter(Boolean)
      .forEach((word) => parsed.excluded.push(word));
    return parsed;
  }

  function handleDescription(id, description) {
    if (description !== null) descriptionCache.set(id, description);
    else if (missingDescriptionLogs-- > 0)
      console.debug(LOG_PREFIX, 'descrição não encontrada no anúncio', id);
    const card = cardsById.get(id);
    if (card) card.description = description === null ? '' : description;
    scheduleRefresh();
  }

  function descriptionMatches(card) {
    const version = [query, config.matchMode, config.fuzzy, configVersion].join('|');
    if (card.descriptionVersion !== version) {
      card.descriptionVersion = version;
      card.descriptionMatched = Matcher.matchesDescription(
        parsedQuery,
        card.title,
        card.description,
        config
      );
    }
    return card.descriptionMatched;
  }

  function evaluateByDescription(card, element) {
    if (card.description === undefined) {
      const cached = descriptionCache.get(card.id);
      if (cached !== undefined) card.description = cached;
    }
    if (card.description !== undefined) {
      return descriptionMatches(card) ? { ok: true, via: 'description' } : REJECTED;
    }
    if (
      Dom.isNearViewport(element) &&
      fetcher.enqueue(card.id, `/marketplace/item/${card.id}/`) === 'full'
    ) {
      card.description = '';
    }
    return REJECTED;
  }

  function evaluateCard(card, element) {
    const isAccessory = config.filterAccessories && Matcher.isAccessory(parsedQuery, card.title);
    if (Matcher.matches(parsedQuery, card.title, config) && !isAccessory)
      return { ok: true, via: 'title' };
    if (!config.searchDescriptions || !fetcher || isAccessory) return REJECTED;
    return evaluateByDescription(card, element);
  }

  function collectCards() {
    document.querySelectorAll(Dom.ITEM_SELECTOR).forEach((anchor) => {
      const id = Dom.itemIdFromHref(anchor.getAttribute('href'));
      if (!id || readAnchors.get(anchor) === id) return;
      readAnchors.set(anchor, id);
      const { title, price, titleNodes } = Dom.readCard(anchor);
      if (!title) return;
      const isNew = queryKey ? visits.observe(queryKey, id) : false;
      const card = { id, title, price, titleNodes, isNew, description: undefined };
      cards.set(Dom.findCardContainer(anchor, id), card);
      cardsById.set(id, card);
    });
  }

  function evaluateCards(active) {
    const entries = [];
    cards.forEach((card, element) => {
      if (!element.isConnected) {
        cards.delete(element);
        cardsById.delete(card.id);
        return;
      }
      if (hidden.has(card.id)) {
        element.classList.add('mkf-hidden');
        return;
      }
      element.classList.remove('mkf-hidden');
      let verdict = active ? evaluateCard(card, element) : { ok: true, via: 'title' };
      if (
        active &&
        verdict.ok &&
        config.onlyNew &&
        config.markNew &&
        !visits.isBaseline &&
        !card.isNew
      )
        verdict = REJECTED;
      entries.push({ card, el: element, verdict });
    });
    return entries;
  }

  function toggleBadgeClass(element, name, on) {
    element.classList.toggle(name, Boolean(on));
    if (on && getComputedStyle(element).position === 'static') element.classList.add('mkf-rel');
  }

  function setAttributeOrRemove(element, name, value) {
    if (value) element.setAttribute(name, value);
    else element.removeAttribute(name);
  }

  function describeNote({ suspicious, fresh, percentBelow }) {
    if (suspicious) return `${fresh ? 'Novo e ' : ''}${percentBelow}% abaixo da mediana`;
    return fresh ? 'Novo' : null;
  }

  function paintEntry({ card, el, verdict }, context, stats) {
    const matched = context.active && verdict.ok;
    const rejected = context.active && !verdict.ok;
    const suspicious =
      matched &&
      config.flagLowPrice &&
      Price.isSuspicious(card.price, context.medianPrice, context.sampleSize);
    const fresh = matched && context.stamps && config.markNew && card.isNew;
    const viaDescription = verdict.via === 'description';

    el.classList.toggle('mkf-dim', rejected && config.action === 'dim');
    el.classList.toggle('mkf-hide', rejected && config.action === 'hide');
    el.classList.toggle('mkf-seen', matched && config.dimSeen && opened.has(card.id));
    toggleBadgeClass(el, 'mkf-good', context.stamps && matched && !viaDescription);
    toggleBadgeClass(el, 'mkf-desc', context.stamps && matched && viaDescription);
    toggleBadgeClass(el, 'mkf-suspect', suspicious);
    toggleBadgeClass(el, 'mkf-new', fresh && !suspicious);

    const tag = context.stamps && matched ? (viaDescription ? 'Na descrição' : 'Combina') : null;
    const percentBelow = suspicious ? Math.round((1 - card.price / context.medianPrice) * 100) : 0;
    setAttributeOrRemove(el, 'data-mkf-tag', tag);
    setAttributeOrRemove(el, 'data-mkf-note', describeNote({ suspicious, fresh, percentBelow }));

    if (!matched) return;
    stats.shown++;
    if (viaDescription) stats.viaDescription++;
    if (card.isNew && config.markNew) stats.fresh++;
    if (suspicious) stats.suspicious++;
  }

  function paintCards(entries, active) {
    const prices = entries
      .filter((entry) => active && entry.verdict.ok && entry.card.price > 0)
      .map((entry) => entry.card.price);
    const context = {
      active,
      stamps: active && config.highlightGood,
      medianPrice: Price.median(prices),
      sampleSize: prices.length
    };
    const stats = { shown: 0, total: entries.length, viaDescription: 0, fresh: 0, suspicious: 0 };
    entries.forEach((entry) => paintEntry(entry, context, stats));
    return stats;
  }

  function paintTitles(entries, active) {
    if (active && config.highlightTerms) {
      Highlight.paint(
        entries.filter((entry) => entry.verdict.ok).map((entry) => entry.card.titleNodes),
        parsedQuery.tokens
      );
    } else {
      Highlight.clear();
    }
  }

  function renderPanel(stats, sortSupported, active) {
    if (!panel) return;
    const profile = profiles[queryKey] || {};
    panel.update({
      visible: Boolean(settings.showPanel && query),
      open: settings.panelOpen,
      enabled: settings.enabled,
      theme: Theme.resolve(settings.theme),
      query,
      stats,
      action: settings.action,
      sortMode: settings.sortMode,
      sortSupported,
      onlyNew: settings.onlyNew,
      dimSeen: settings.dimSeen,
      baseline: Boolean(visits && visits.isBaseline && settings.markNew && active),
      hiddenCount: hidden.size,
      profile: {
        custom: Boolean(profiles[queryKey]),
        excludeWords: profile.excludeWords || '',
        matchMode: config.matchMode,
        filterAccessories: config.filterAccessories,
        searchDescriptions: config.searchDescriptions
      },
      fetch: { enabled: config.searchDescriptions, ...fetcher.stats() }
    });
  }

  function applyFilter() {
    const active = isFilterActive();
    collectCards();
    if (queryKey) visits.touch(queryKey);
    const entries = evaluateCards(active);
    const stats = paintCards(entries, active);
    paintTitles(entries, active);
    const sortSupported = sorter.apply(entries, { active, mode: settings.sortMode });
    renderPanel(stats, sortSupported, active);
  }

  function resetCards() {
    cards.forEach((_, element) => {
      element.classList.remove(...CARD_CLASSES);
      CARD_ATTRIBUTES.forEach((name) => element.removeAttribute(name));
    });
    sorter.reset();
    cards.clear();
    cardsById.clear();
    readAnchors = new WeakMap();
    Highlight.clear();
  }

  function refresh() {
    const current = Dom.getSearchQuery();
    if (current !== query) {
      resetCards();
      query = current;
      queryKey = Matcher.normalize(current);
      if (queryKey) visits.begin(queryKey);
      console.debug(LOG_PREFIX, 'busca detectada:', JSON.stringify(query));
    }
    computeConfig();
    parsedQuery = query ? parseCurrentQuery() : null;
    applyFilter();
  }

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, DEBOUNCE_MS);
  }

  function saveProfiles(next) {
    profiles = next;
    chrome.storage.local.set({ mkfProfiles: profiles });
    refresh();
  }

  function hideAd(id) {
    hidden.set(id);
    applyFilter();
    panel.toast('Anúncio ocultado', 'Desfazer', () => {
      hidden.delete(id);
      applyFilter();
    });
  }

  function handleAction(name, payload) {
    switch (name) {
      case 'setting':
        chrome.storage.sync.set({ [payload.key]: payload.value });
        break;
      case 'toggleOpen':
        chrome.storage.sync.set({ panelOpen: payload.value });
        break;
      case 'profile':
        if (queryKey)
          saveProfiles({ ...profiles, [queryKey]: { ...(profiles[queryKey] || {}), ...payload } });
        break;
      case 'profileReset': {
        const { [queryKey]: _removed, ...rest } = profiles;
        saveProfiles(rest);
        break;
      }
      case 'restoreHidden':
        hidden.clear();
        applyFilter();
        break;
      case 'openOptions':
        chrome.runtime.sendMessage({ type: 'openOptions' });
        break;
      default:
        break;
    }
  }

  function handlePointerOver(event) {
    if (!panel || event.target === panel.host) return;
    const element = Dom.findTrackedAncestor(event.target, cards);
    if (element && !hidden.has(cards.get(element).id)) {
      panel.showToolbar(element, () => hideAd(cards.get(element).id));
    } else {
      panel.hideToolbarSoon();
    }
  }

  function handleItemOpened(event) {
    const anchor = event.target instanceof Element ? event.target.closest(Dom.ITEM_SELECTOR) : null;
    const id = anchor && Dom.itemIdFromHref(anchor.getAttribute('href'));
    if (!id || opened.has(id)) return;
    opened.set(id);
    scheduleRefresh();
  }

  function handleSettingsChange(changes) {
    Object.keys(changes).forEach((key) => {
      settings[key] = changes[key].newValue ?? DEFAULTS[key];
    });
    if ('synonymsText' in changes || 'accessoryText' in changes) {
      Matcher.configure(settings);
      configVersion++;
    }
    if ('enabled' in changes) panel.toast(settings.enabled ? 'Filtro ligado' : 'Filtro desligado');
    refresh();
  }

  function listenToStorage() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') handleSettingsChange(changes);
      else if (area === 'local' && changes.mkfProfiles) {
        profiles = changes.mkfProfiles.newValue || {};
        refresh();
      }
    });
  }

  function listenToPage() {
    new MutationObserver(scheduleRefresh).observe(document.body, {
      childList: true,
      subtree: true
    });
    window.addEventListener('popstate', scheduleRefresh);
    window.addEventListener(
      'scroll',
      () => {
        panel.hideToolbarSoon();
        scheduleRefresh();
      },
      { passive: true }
    );
    document.addEventListener('mouseover', handlePointerOver, { passive: true });
    document.addEventListener('click', handleItemOpened, true);
    document.addEventListener('auxclick', handleItemOpened, true);
    setInterval(() => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      scheduleRefresh();
    }, URL_POLL_MS);
  }

  async function loadStyles() {
    if (!(chrome.runtime && chrome.runtime.getURL)) return '';
    try {
      const sheets = await Promise.all(
        STYLE_FILES.map((file) =>
          fetch(chrome.runtime.getURL(file)).then((response) => response.text())
        )
      );
      return sheets.join('\n');
    } catch (error) {
      console.warn(LOG_PREFIX, 'não consegui carregar o CSS do painel', error);
      return '';
    }
  }

  async function setUpStores() {
    const area = chrome.storage.local;
    descriptionCache = DescriptionCache.create(area, {
      ttlMs: DESCRIPTION_TTL_MS,
      maxEntries: DESCRIPTION_CACHE_SIZE
    });
    listed = History.create(area, 'mkfListed', { max: HISTORY_LIMITS.listed });
    opened = History.create(area, 'mkfOpened', { max: HISTORY_LIMITS.opened });
    hidden = History.create(area, 'mkfHidden', { max: HISTORY_LIMITS.hidden });
    visits = Visits.create(listed);
    try {
      profiles = (await area.get('mkfProfiles')).mkfProfiles || {};
    } catch (_) {
      profiles = {};
    }
    await Promise.all([descriptionCache.load(), listed.load(), opened.load(), hidden.load()]);
  }

  async function init(stored) {
    settings = { ...DEFAULTS, ...stored };
    Matcher.configure(settings);
    await setUpStores();
    fetcher = DescriptionFetcher.create({
      fetchFn: (url, options) => fetch(url, options),
      onResult: handleDescription,
      onChange: scheduleRefresh
    });
    panel = Panel.create({ styles: await loadStyles(), onAction: handleAction });
    console.debug(LOG_PREFIX, 'ativo em', location.href);
    refresh();
    listenToPage();
    listenToStorage();
  }

  chrome.storage.sync.get(DEFAULTS, init);
})();
