const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const CONTENT_SCRIPTS = MANIFEST.content_scripts[0].js;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const listing = (id, price, title, city = 'Criciúma, SC') => `
  <div class="cell"><div>
    <a href="/marketplace/item/${id}/?ref=search"><div>
      <span>Acabou de ser anunciado</span><span>${price}</span><span>${title}</span><span>${city}</span>
    </div></a>
  </div></div>`;

function bootPage({ html, query, settings = {}, localData = {}, gridStyle = '', fetchImpl }) {
  const dom = new JSDOM(`<body><div id="grid" style="${gridStyle}">${html}</div></body>`, {
    url: `https://www.facebook.com/marketplace/1/search/?query=${encodeURIComponent(query)}`,
    runScripts: 'outside-only'
  });
  const { window } = dom;
  const local = { ...localData };

  window.chrome = {
    storage: {
      sync: { get: (defaults, callback) => callback({ ...defaults, ...settings }), set: () => {} },
      local: {
        get: async (key) => ({ [key]: local[key] }),
        set: async (values) => Object.assign(local, values)
      },
      onChanged: { addListener: () => {} }
    }
  };
  window.fetch =
    fetchImpl ||
    (async () => {
      throw new Error('network is off in this test');
    });

  CONTENT_SCRIPTS.forEach((file) => window.eval(fs.readFileSync(path.join(ROOT, file), 'utf8')));

  const cells = () => [...window.document.querySelectorAll('.cell')];
  return {
    window,
    close: () => window.close(),
    cell: (position) => cells()[position - 1],
    classes: (position) => cells()[position - 1].className,
    panelText: () => window.document.getElementById('mkf-root').shadowRoot.textContent,
    append: (markup) =>
      window.document.getElementById('grid').insertAdjacentHTML('beforeend', markup)
  };
}

async function withPage(options, run) {
  const page = bootPage(options);
  try {
    await run(page);
  } finally {
    page.close();
  }
}

module.exports = { bootPage, withPage, listing, wait };
