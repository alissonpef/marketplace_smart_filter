(function (root) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const TOAST_DURATION_MS = 5000;
  const TOOLBAR_HIDE_DELAY_MS = 250;
  const TOOLBAR_MARGIN = 8;
  const BRAND_COLOR = '#0f766e';
  const ICON_PATHS = {
    close: 'M6 6l12 12M18 6L6 18',
    eyeOff:
      'M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.5 1.2-1.5 2.6-2.9 3.8M6.1 6.1C4 7.6 2.5 9.8 2 12c1 2.5 5 7 10 7 1.5 0 2.9-.4 4.1-1'
  };
  const DISPLAY_ACTIONS = [
    ['dim', 'Escurecer'],
    ['hide', 'Esconder']
  ];
  const SORT_MODES = [
    ['original', 'Original'],
    ['asc', 'Menor preço'],
    ['desc', 'Maior preço']
  ];
  const MATCH_MODES = [
    ['all', 'Estrita'],
    ['smart', 'Inteligente']
  ];

  function h(tag, props, ...children) {
    const element = document.createElement(tag);
    Object.entries(props || {}).forEach(([name, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (name.startsWith('on')) element.addEventListener(name.slice(2), value);
      else element.setAttribute(name, value === true ? '' : value);
    });
    children.flat().forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      element.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return element;
  }

  function svg(tag, attributes) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  }

  function createIcon(name, size = 16) {
    const icon = svg('svg', {
      viewBox: '0 0 24 24',
      width: size,
      height: size,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true'
    });
    icon.append(svg('path', { d: ICON_PATHS[name] }));
    return icon;
  }

  function createLogo(size) {
    const logo = svg('svg', {
      viewBox: '0 0 24 24',
      width: size,
      height: size,
      'aria-hidden': 'true'
    });
    logo.append(
      svg('rect', { width: 24, height: 24, rx: 6, fill: BRAND_COLOR }),
      svg('path', { d: 'M4.5 12L9 6.5h10.5v11H9z', fill: '#fff' }),
      svg('circle', { cx: 9.4, cy: 12, r: 1.3, fill: BRAND_COLOR }),
      svg('path', {
        d: 'M12.6 12.2l1.9 1.9 3.5-3.9',
        fill: 'none',
        stroke: BRAND_COLOR,
        'stroke-width': 1.7,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      })
    );
    return logo;
  }

  function createSwitch(onChange, label) {
    const button = h(
      'button',
      {
        type: 'button',
        class: 'ui-switch',
        role: 'switch',
        'aria-checked': 'false',
        'aria-label': label
      },
      h('span')
    );
    button.addEventListener('click', () =>
      onChange(button.getAttribute('aria-checked') !== 'true')
    );
    return {
      element: button,
      set: (value) => button.setAttribute('aria-checked', String(Boolean(value)))
    };
  }

  function createSegmented(options, onChange, label) {
    const buttons = options.map(([value, text]) =>
      h(
        'button',
        {
          type: 'button',
          role: 'radio',
          'aria-checked': 'false',
          'data-value': value,
          onclick: () => onChange(value)
        },
        text
      )
    );
    return {
      element: h('div', { class: 'ui-seg', role: 'radiogroup', 'aria-label': label }, buttons),
      set: (value) =>
        buttons.forEach((button) =>
          button.setAttribute('aria-checked', String(button.dataset.value === value))
        )
    };
  }

  const createRow = (label, control, hint) =>
    h(
      'div',
      null,
      h('div', { class: 'ui-row' }, h('span', { class: 'ui-label' }, label), control),
      hint && h('p', { class: 'ui-hint' }, hint)
    );

  const createField = (label, control) =>
    h('div', { class: 'ui-field' }, h('span', { class: 'ui-heading' }, label), control);

  function createLegendItem(label, tone) {
    const value = h('b');
    return {
      element: h('li', null, h('span', { class: `ui-tag ${tone}` }), h('span', null, label), value),
      set: (text) => {
        value.textContent = String(text);
      }
    };
  }

  function createHeader(onAction) {
    const query = h('p', { class: 'header-query' });
    const power = createSwitch(
      (value) => onAction('setting', { key: 'enabled', value }),
      'Ligar ou desligar o filtro'
    );
    const collapse = h(
      'button',
      {
        type: 'button',
        class: 'icon-button',
        title: 'Recolher',
        'aria-label': 'Recolher painel',
        onclick: () => onAction('toggleOpen', { value: false })
      },
      createIcon('close')
    );
    return {
      element: h(
        'header',
        { class: 'header' },
        createLogo(28),
        h('div', { class: 'header-names' }, h('h2', null, 'Smart Filter'), query),
        power.element,
        collapse
      ),
      update(vm) {
        query.textContent = vm.query;
        power.set(vm.enabled);
      }
    };
  }

  function createSummary() {
    const number = h('strong', { class: 'summary-number' });
    const sentence = h('span', { class: 'summary-text' });
    const legend = {
      description: createLegendItem('Achados na descrição', 'amber'),
      fresh: createLegendItem('Novos desde a última visita', 'ink'),
      suspicious: createLegendItem('Preço suspeito', 'brick')
    };
    return {
      element: h(
        'section',
        { class: 'ui-section' },
        h('p', { class: 'summary-headline' }, number, sentence),
        h('ul', { class: 'legend' }, ...Object.values(legend).map((item) => item.element))
      ),
      update({ enabled, stats, baseline }) {
        if (!enabled) {
          number.textContent = '–';
          sentence.textContent = 'Filtro desligado';
        } else if (stats.total === 0) {
          number.textContent = '0';
          sentence.textContent = 'Nenhum anúncio carregado ainda';
        } else {
          number.textContent = String(stats.shown);
          sentence.textContent = `de ${stats.total} anúncios combinam`;
        }
        legend.description.set(stats.viaDescription);
        legend.fresh.set(baseline ? '–' : stats.fresh);
        legend.suspicious.set(stats.suspicious);
      }
    };
  }

  function createDisplaySection(onAction) {
    const setSetting = (key) => (value) => onAction('setting', { key, value });
    const action = createSegmented(
      DISPLAY_ACTIONS,
      setSetting('action'),
      'Anúncios que não combinam'
    );
    const onlyNew = createSwitch(setSetting('onlyNew'), 'Mostrar só os novos');
    const dimSeen = createSwitch(setSetting('dimSeen'), 'Esmaecer os que já abri');
    return {
      element: h(
        'section',
        { class: 'ui-section' },
        createField('Anúncios que não combinam', action.element),
        createRow('Mostrar só os novos', onlyNew.element, 'Desde a sua última visita.'),
        createRow('Esmaecer os que já abri', dimSeen.element)
      ),
      update(vm) {
        action.set(vm.action);
        onlyNew.set(vm.onlyNew);
        dimSeen.set(vm.dimSeen);
      }
    };
  }

  function createSortSection(onAction) {
    const sort = createSegmented(
      SORT_MODES,
      (value) => onAction('setting', { key: 'sortMode', value }),
      'Ordenar por preço'
    );
    const note = h(
      'p',
      { class: 'ui-hint', hidden: true },
      'Esta página não permite reordenar os anúncios.'
    );
    return {
      element: h(
        'section',
        { class: 'ui-section' },
        createField('Ordenar por preço', sort.element),
        note
      ),
      update(vm) {
        sort.set(vm.sortMode);
        note.hidden = vm.sortSupported || vm.sortMode === 'original';
      }
    };
  }

  function createSearchProfileSection(onAction) {
    const setProfile = (field) => (value) => onAction('profile', { [field]: value });
    const exclude = h('input', {
      class: 'ui-input',
      type: 'text',
      placeholder: 'defeito, quebrado',
      'aria-label': 'Palavras a excluir nesta busca'
    });
    exclude.addEventListener('change', () => onAction('profile', { excludeWords: exclude.value }));
    exclude.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') exclude.blur();
    });
    const matchMode = createSegmented(MATCH_MODES, setProfile('matchMode'), 'Rigidez da busca');
    const accessories = createSwitch(setProfile('filterAccessories'), 'Filtrar acessórios');
    const descriptions = createSwitch(setProfile('searchDescriptions'), 'Ler descrições');
    const customBadge = h('span', { class: 'badge', hidden: true }, 'personalizada');
    const reset = h(
      'button',
      { type: 'button', class: 'ui-link', onclick: () => onAction('profileReset') },
      'Voltar ao padrão'
    );
    return {
      element: h(
        'details',
        { class: 'ui-section search-profile' },
        h('summary', null, h('span', null, 'Só nesta busca', customBadge)),
        h(
          'div',
          { class: 'search-profile-body' },
          createField('Palavras a excluir', exclude),
          createField('Rigidez', matchMode.element),
          createRow('Filtrar acessórios', accessories.element),
          createRow('Ler descrições', descriptions.element),
          reset
        )
      ),
      update(vm, shadow) {
        matchMode.set(vm.profile.matchMode);
        accessories.set(vm.profile.filterAccessories);
        descriptions.set(vm.profile.searchDescriptions);
        customBadge.hidden = !vm.profile.custom;
        reset.hidden = !vm.profile.custom;
        if (shadow.activeElement !== exclude) exclude.value = vm.profile.excludeWords;
      }
    };
  }

  function createStatus(onAction) {
    const container = h('div', { class: 'status' });
    return {
      element: h('section', { class: 'ui-section', hidden: true }, container),
      update(vm) {
        const lines = [];
        if (vm.baseline)
          lines.push(
            h(
              'p',
              null,
              'Primeira visita a esta busca. Guardei os anúncios de agora; na próxima vez, marco os novos.'
            )
          );
        if (vm.fetch.paused)
          lines.push(
            h(
              'p',
              null,
              'Leitura de descrições pausada: o Facebook limitou os pedidos. Tento de novo em alguns minutos.'
            )
          );
        else if (vm.fetch.enabled && vm.fetch.queued)
          lines.push(h('p', null, `Lendo descrições (${vm.fetch.queued} na fila)`));
        if (vm.hiddenCount) {
          lines.push(
            h(
              'p',
              null,
              `${vm.hiddenCount} ${vm.hiddenCount === 1 ? 'anúncio oculto' : 'anúncios ocultos'} `,
              h(
                'button',
                { type: 'button', class: 'ui-link', onclick: () => onAction('restoreHidden') },
                'Restaurar'
              )
            )
          );
        }
        container.replaceChildren(...lines);
        container.parentElement.hidden = lines.length === 0;
      }
    };
  }

  function createFooter(onAction) {
    return {
      element: h(
        'footer',
        { class: 'ui-section footer' },
        h(
          'button',
          { type: 'button', class: 'ui-link', onclick: () => onAction('openOptions') },
          'Mais opções'
        ),
        h('span', null, 'Atalho ', h('kbd', { class: 'ui-kbd' }, 'Alt+Shift+F'))
      ),
      update() {}
    };
  }

  function createPill(onAction) {
    const count = h('span', { class: 'pill-count' });
    const label = h('span', { class: 'pill-label' }, 'combinam');
    return {
      element: h(
        'button',
        {
          type: 'button',
          class: 'pill',
          title: 'Abrir o painel do Smart Filter',
          onclick: () => onAction('toggleOpen', { value: true })
        },
        createLogo(24),
        count,
        label
      ),
      update(vm) {
        count.textContent = vm.enabled ? String(vm.stats.shown) : 'Filtro desligado';
        label.hidden = !vm.enabled;
      }
    };
  }

  function createHoverToolbar() {
    let handler = null;
    let hideTimer = null;
    const element = h(
      'div',
      { class: 'toolbar', hidden: true },
      h(
        'button',
        {
          type: 'button',
          class: 'toolbar-button',
          title: 'Ocultar este anúncio',
          onclick: () => {
            const run = handler;
            hide();
            if (run) run();
          }
        },
        createIcon('eyeOff', 14),
        'Ocultar anúncio'
      )
    );
    element.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    element.addEventListener('mouseleave', () => hideSoon());

    function hide() {
      element.hidden = true;
      handler = null;
    }

    function hideSoon() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, TOOLBAR_HIDE_DELAY_MS);
    }

    function show(target, onHide) {
      clearTimeout(hideTimer);
      const rect = target.getBoundingClientRect();
      if (rect.bottom < 40 || rect.top > window.innerHeight) {
        hide();
        return;
      }
      handler = onHide;
      element.style.top = `${Math.max(TOOLBAR_MARGIN, rect.top + TOOLBAR_MARGIN)}px`;
      element.style.left = `${rect.left + TOOLBAR_MARGIN}px`;
      element.hidden = false;
    }

    return { element, show, hideSoon };
  }

  function createToast() {
    let timer = null;
    const message = h('span');
    const action = h('button', { type: 'button', class: 'ui-link' });
    const element = h('div', { class: 'toast', role: 'status', hidden: true }, message, action);

    function show(text, actionLabel, onAction) {
      clearTimeout(timer);
      message.textContent = text;
      action.hidden = !actionLabel;
      action.textContent = actionLabel || '';
      action.onclick = () => {
        element.hidden = true;
        if (onAction) onAction();
      };
      element.hidden = false;
      timer = setTimeout(() => {
        element.hidden = true;
      }, TOAST_DURATION_MS);
    }

    return { element, show };
  }

  function applyStyles(shadow, styles) {
    if (!styles) return;
    if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in shadow) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(styles);
      shadow.adoptedStyleSheets = [sheet];
    } else {
      shadow.append(h('style', null, styles));
    }
  }

  function createEmptyBanner(onAction) {
    const title = h('span', { class: 'empty-banner-title' });
    const subtitle = h('span', { class: 'empty-banner-sub' });
    const actionBtn = h(
      'button',
      {
        type: 'button',
        class: 'empty-banner-btn',
        onclick: () => onAction('setting', { key: 'action', value: 'dim' })
      },
      'Mostrar anúncios'
    );
    const relaxBtn = h(
      'button',
      {
        type: 'button',
        class: 'empty-banner-btn empty-banner-btn-pine',
        onclick: () => onAction('profile', { matchMode: 'smart' })
      },
      '⚡ Busca Inteligente'
    );
    const closeBtn = h(
      'button',
      {
        type: 'button',
        class: 'icon-button',
        title: 'Fechar aviso',
        onclick: () => {
          dismissedQuery = currentQuery;
          element.hidden = true;
        }
      },
      createIcon('close', 14)
    );

    let dismissedQuery = '';
    let currentQuery = '';

    const element = h(
      'div',
      { class: 'empty-banner', hidden: true, role: 'status' },
      createIcon('eyeOff', 20),
      h('div', { class: 'empty-banner-text' }, title, subtitle),
      h('div', { class: 'empty-banner-actions' }, relaxBtn, actionBtn),
      closeBtn
    );

    function update(vm) {
      currentQuery = vm.query || '';
      const shouldShow =
        vm.enabled &&
        vm.query &&
        vm.stats &&
        vm.stats.total > 0 &&
        vm.stats.shown === 0 &&
        dismissedQuery !== currentQuery;

      if (!shouldShow) {
        element.hidden = true;
        return;
      }

      title.textContent = `Nenhum anúncio combinou com "${vm.query}"`;
      subtitle.textContent = `${vm.stats.total} anúncio${vm.stats.total === 1 ? '' : 's'} analisados na página.`;
      relaxBtn.hidden = vm.profile.matchMode === 'smart';
      actionBtn.hidden = vm.action === 'dim';
      element.hidden = false;
    }

    return { element, update };
  }

  function create({ styles, onAction }) {
    const host = h('div', { id: 'mkf-root' });
    Object.assign(host.style, {
      position: 'fixed',
      left: '0',
      bottom: '0',
      width: '0',
      height: '0',
      zIndex: '2147483647'
    });
    const shadow = host.attachShadow({ mode: 'open' });
    applyStyles(shadow, styles);

    const pill = createPill(onAction);
    const emptyBanner = createEmptyBanner(onAction);
    const toolbar = createHoverToolbar();
    const toast = createToast();
    const sections = [
      createHeader(onAction),
      createSummary(),
      createDisplaySection(onAction),
      createSortSection(onAction),
      createSearchProfileSection(onAction),
      createStatus(onAction),
      createFooter(onAction)
    ];
    const panel = h(
      'div',
      { class: 'panel', role: 'region', 'aria-label': 'Marketplace Smart Filter' },
      ...sections.map((section) => section.element)
    );
    const wrapper = h(
      'div',
      { class: 'ui-root', 'data-theme': 'light' },
      h('div', { class: 'dock' }, emptyBanner.element, toast.element, pill.element, panel),
      toolbar.element
    );
    shadow.append(wrapper);
    document.documentElement.append(host);

    function update(vm) {
      host.style.display = vm.visible ? '' : 'none';
      wrapper.setAttribute('data-theme', vm.theme);
      pill.element.hidden = vm.open;
      panel.hidden = !vm.open;
      pill.update(vm);
      emptyBanner.update(vm);
      sections.forEach((section) => section.update(vm, shadow));
    }

    return {
      update,
      host,
      showToolbar: toolbar.show,
      hideToolbarSoon: toolbar.hideSoon,
      toast: toast.show
    };
  }

  const api = { create };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { Panel: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
