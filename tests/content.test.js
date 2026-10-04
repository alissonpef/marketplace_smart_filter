const test = require('node:test');
const assert = require('node:assert/strict');
const { withPage, listing, wait } = require('./support/page.js');

const HOUR = 60 * 60 * 1000;

test('marks matches, dims the rest and shows the panel', async () => {
  await withPage(
    {
      query: 'dell g15',
      html:
        listing(1, 'R$4.200', 'ACER NITRO V15 RTX 3050') +
        listing(2, 'R$5.000', 'Notebook Dell G15 Gamer') +
        listing(3, 'R$550', 'Vendo moto g15') +
        listing(4, 'R$80', 'Capinha para Dell G15') +
        listing(5, 'R$500', 'Vendo moto g 15')
    },
    async (page) => {
      await wait(120);
      assert.match(page.classes(1), /mkf-dim/);
      assert.match(page.classes(2), /mkf-good/);
      assert.equal(page.cell(2).getAttribute('data-mkf-tag'), 'Combina');
      assert.match(page.classes(3), /mkf-dim/);
      assert.match(page.classes(4), /mkf-dim/);
      assert.match(page.classes(5), /mkf-dim/);
      assert.match(page.panelText(), /Smart Filter/);
      assert.match(page.panelText(), /dell g15/);
      assert.match(page.panelText(), /de 5 anúncios combinam/);
      assert.match(page.panelText(), /Primeira visita/);
    }
  );
});

test('evaluates listings that arrive later and searches that change without reload', async () => {
  await withPage(
    {
      query: 'dell g15',
      html:
        listing(1, 'R$4.200', 'ACER NITRO V15') +
        listing(2, 'R$5.000', 'Notebook Dell G15') +
        listing(3, 'R$550', 'Vendo moto g15')
    },
    async (page) => {
      await wait(120);
      page.append(listing(4, 'R$6.000', 'Dell G15 i7 + RTX 3060'));
      await wait(300);
      assert.match(page.classes(4), /mkf-good/);

      page.window.history.pushState({}, '', '/marketplace/1/search/?query=moto');
      page.append(listing(5, 'R$1', 'x'));
      await wait(1300);
      assert.match(page.classes(3), /mkf-good/);
      assert.match(page.classes(2), /mkf-dim/);
    }
  );
});

test('rescues listings through the description and ignores trade offers', async () => {
  const pages = {
    10: '"redacted_description":{"text":"Vendo meu notebook.\\nDell G15 5520, i5 12a, RTX 3050."}',
    11: '"redacted_description":{"text":"Aceito troca por Dell G15 antigo"}'
  };
  const requested = [];
  await withPage(
    {
      query: 'dell g15',
      settings: { searchDescriptions: true },
      html:
        listing(10, 'R$3.000', 'Notebook gamer potente') + listing(11, 'R$500', 'Moto g15 256gb'),
      fetchImpl: async (url) => {
        requested.push(url);
        const id = /item\/(\d+)/.exec(url)[1];
        return {
          ok: true,
          status: 200,
          url: `https://www.facebook.com${url}`,
          text: async () => `<script>{${pages[id]}}</script>`
        };
      }
    },
    async (page) => {
      await wait(250);
      assert.match(page.classes(1), /mkf-desc/);
      assert.equal(page.cell(1).getAttribute('data-mkf-tag'), 'Na descrição');
      assert.match(page.classes(2), /mkf-dim/);
      assert.ok(requested.some((url) => url.includes('/item/10/')));
    }
  );
});

test('does not open listings in the background unless descriptions are enabled', async () => {
  const requested = [];
  await withPage(
    {
      query: 'dell g15',
      html: listing(20, 'R$3.000', 'Notebook gamer potente'),
      fetchImpl: async (url) => {
        requested.push(url);
        throw new Error('unexpected request');
      }
    },
    async () => {
      await wait(200);
      assert.equal(requested.length, 0);
    }
  );
});

test('flags prices far below the median', async () => {
  await withPage(
    {
      query: 'dell g15',
      html: [3000, 3200, 3100, 3300, 3000, 400]
        .map((price, index) =>
          listing(30 + index, `R$${price.toLocaleString('pt-BR')}`, 'Notebook Dell G15 gamer')
        )
        .join('')
    },
    async (page) => {
      await wait(150);
      assert.match(page.classes(6), /mkf-suspect/);
      assert.match(page.cell(6).getAttribute('data-mkf-note'), /abaixo da mediana/);
      assert.doesNotMatch(page.classes(1), /mkf-suspect/);
    }
  );
});

test('marks new, already opened and hidden listings', async () => {
  const now = Date.now();
  await withPage(
    {
      query: 'dell g15',
      localData: {
        mkfListed: {
          'dell g15|*': now - HOUR,
          'dell g15|@': now - 2 * HOUR,
          'dell g15|1': now - 2 * HOUR,
          'dell g15|2': now - 2 * HOUR,
          'dell g15|4': now - 2 * HOUR
        },
        mkfOpened: { 1: now },
        mkfHidden: { 4: now }
      },
      html:
        listing(1, 'R$3.000', 'Notebook Dell G15') +
        listing(2, 'R$3.100', 'Dell G15 5520') +
        listing(3, 'R$3.200', 'Dell G15 novo') +
        listing(4, 'R$3.300', 'Dell G15 oculto')
    },
    async (page) => {
      await wait(150);
      assert.match(page.classes(1), /mkf-seen/);
      assert.doesNotMatch(page.classes(2), /mkf-new/);
      assert.match(page.classes(3), /mkf-new/);
      assert.equal(page.cell(3).getAttribute('data-mkf-note'), 'Novo');
      assert.match(page.classes(4), /mkf-hidden/);
    }
  );
});

test('"only new" dims listings from earlier visits', async () => {
  const now = Date.now();
  await withPage(
    {
      query: 'dell g15',
      settings: { onlyNew: true },
      localData: {
        mkfListed: {
          'dell g15|*': now - HOUR,
          'dell g15|@': now - 2 * HOUR,
          'dell g15|1': now - 2 * HOUR
        }
      },
      html: listing(1, 'R$3.000', 'Notebook Dell G15') + listing(2, 'R$3.100', 'Dell G15 novo')
    },
    async (page) => {
      await wait(150);
      assert.match(page.classes(1), /mkf-dim/);
      assert.match(page.classes(2), /mkf-good/);
    }
  );
});

test('hide mode removes non-matching listings from the layout', async () => {
  await withPage(
    {
      query: 'dell g15',
      settings: { action: 'hide' },
      html: listing(1, 'R$3.000', 'Notebook Dell G15') + listing(2, 'R$100', 'Moto g15')
    },
    async (page) => {
      await wait(150);
      assert.match(page.classes(2), /mkf-hide/);
      assert.doesNotMatch(page.classes(1), /mkf-hide/);
    }
  );
});

test('sorts matches by price and sends the rest to the end', async () => {
  await withPage(
    {
      query: 'dell g15',
      settings: { sortMode: 'asc' },
      gridStyle: 'display:grid',
      html:
        listing(1, 'R$3.000', 'Dell G15 A') +
        listing(2, 'R$1.000', 'Dell G15 B') +
        listing(3, 'R$100', 'Moto g15') +
        listing(4, 'R$2.000', 'Dell G15 C')
    },
    async (page) => {
      await wait(150);
      assert.deepEqual(
        [1, 2, 3, 4].map((position) => page.cell(position).style.order),
        ['3', '1', '4', '2']
      );
    }
  );
});

test('shows empty notice when no listings match the query', async () => {
  await withPage(
    {
      query: 'dell g15',
      html: listing(1, 'R$500', 'Moto g15') + listing(2, 'R$80', 'Capinha para Dell G15')
    },
    async (page) => {
      await wait(150);
      const banner = page.window.document
        .getElementById('mkf-root')
        .shadowRoot.querySelector('.empty-banner');
      assert.ok(banner);
      assert.equal(banner.hidden, false);
      assert.match(banner.textContent, /Nenhum anúncio combinou/);
      assert.match(banner.textContent, /dell g15/);
    }
  );
});
