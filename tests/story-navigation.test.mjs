import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const read = (name) => readFile(new URL(name, import.meta.url), 'utf8');
const variants = stripTypeScriptTypes(
  await read('../lib/story-variants.ts'),
).replaceAll('export ', '');
const chrome = await read('../components/site/chrome.tsx');
const start = chrome.indexOf('  const storyHref =');
const handlers = stripTypeScriptTypes(
  chrome.slice(start, chrome.indexOf('  useEffect(', start)),
);

function header(url) {
  const location = new URL(url);
  const navigations = [];
  const sandbox = {
    URL,
    URLSearchParams,
    location,
    pathname: location.pathname,
    lang: location.searchParams.get('lang') ?? 'zh',
    history: {
      state: { preserved: true },
      pushState(state, title, href) {
        navigations.push({ state, url: new URL(href).href });
      },
    },
    document: {
      getElementById: () => ({ getBoundingClientRect: () => ({ top: 100 }) }),
    },
    scrollY: 420,
    setOpen() {},
    requestAnimationFrame: (callback) => callback(),
    scrollPageTo() {},
  };
  const api = runInNewContext(
    `${variants}\nconst product = storyProductFromLocation(location.pathname, location.search);\n${handlers}\n({ storyHref, goToChapter, product });`,
    sandbox,
  );
  return { ...api, location, navigations };
}

test('returning from a showroom or product detail continues that product journey', () => {
  for (const id of ['open-frame-small', 'silent', 'container']) {
    for (const path of [
      `/showroom?lang=en&model=${id}`,
      `/showroom?lang=en&product=${id}`,
      `/products/${id}?lang=en`,
    ]) {
      const h = header(`https://frs.example${path}`);
      const destination = new URL(h.storyHref('products'), h.location);
      assert.equal(destination.searchParams.get('product'), id, path);
      assert.equal(destination.searchParams.get('lang'), 'en', path);
      assert.equal(destination.hash, '#products', path);
    }
  }
});

test('the displayed showroom model and detail route take precedence over stale query state', () => {
  assert.equal(
    header('https://frs.example/showroom?model=container&product=silent')
      .product,
    'container',
  );
  assert.equal(
    header('https://frs.example/products/silent?product=container').product,
    'silent',
  );
  assert.equal(
    header('https://frs.example/products/open-frame').product,
    'open-frame-small',
  );
  for (const path of [
    '/about',
    '/showroom?model=unknown',
    '/products/mobile',
  ]) {
    const h = header(`https://frs.example${path}`);
    assert.equal(h.product, null);
    assert.equal(h.storyHref('start'), '/?lang=zh#start');
  }
});

test('homepage chapter navigation preserves the selected product and language', () => {
  const h = header('https://frs.example/?lang=en&product=container#products');
  assert.equal(h.storyHref('company'), '#company');
  let prevented = false;
  h.goToChapter({ preventDefault: () => (prevented = true) }, 'company');
  assert.equal(prevented, true);
  assert.equal(h.navigations.length, 1);
  assert.equal(
    h.navigations[0].url,
    'https://frs.example/?lang=en&product=container#company',
  );
  assert.deepEqual(h.navigations[0].state, { preserved: true });
});

test('changing the language keeps the selected model and current chapter', async () => {
  const provider = await read('../components/site/provider.tsx');
  const start = provider.indexOf('  const setLang =');
  const handler = stripTypeScriptTypes(
    provider.slice(start, provider.indexOf('\n  return (', start)),
  );
  let navigated;
  const events = [];
  const setLang = runInNewContext(`${handler}\nsetLang`, {
    URL,
    Event,
    location: new URL('https://frs.example/?lang=zh&product=silent#delivery'),
    localStorage: { setItem() {} },
    history: { replaceState: (state, title, url) => (navigated = url.href) },
    window: { dispatchEvent: (event) => events.push(event.type) },
  });
  setLang('en');
  assert.equal(
    navigated,
    'https://frs.example/?lang=en&product=silent#delivery',
  );
  assert.deepEqual(events, ['flydeer:location']);
});
