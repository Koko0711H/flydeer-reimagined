import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import * as storyMath from '../lib/story-math.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const componentSource = await read('../components/site/story-stage.tsx');
// Execute the actual component effects, loader and player. Only JSX, React's
// hook host, DOM measurements and asynchronous browser services are replaced.
const stageSource = stripTypeScriptTypes(
  componentSource
    .slice(componentSource.indexOf('export function StoryStage'))
    .split('  return (\n    <>')[0] + '\n}',
).replace('export function', 'function');
const runtime = [
  await read('../lib/story-variants.ts'),
  await read('../lib/frame-sequence.ts'),
]
  .map((source) => stripTypeScriptTypes(source).replaceAll('export ', ''))
  .join('\n');
const manifest = JSON.parse(await read('../public/media/story/manifest.json'));

function harness(t, { reduced = false, hasContext = true } = {}) {
  const hooks = [],
    requests = [],
    decodes = [],
    images = [],
    paints = [],
    frames = new Map(),
    timers = new Map(),
    listeners = new Map();
  let hookIndex = 0,
    nextId = 0,
    observers = 0;
  const style = () => ({
    setProperty(key, value) {
      this[key] = value;
    },
    removeProperty(key) {
      delete this[key];
    },
  });
  const context = {
    clearRect() {},
    drawImage(image) {
      assert.equal(image.closed, 0, 'released frames must not be painted');
      paints.push(image.url);
    },
  };
  const canvas = {
    width: 1400,
    height: 1000,
    style: style(),
    getContext: () => (hasContext ? context : null),
  };
  const shots = Array.from({ length: 8 }, () => ({
    style: style(),
    offsetHeight: 720,
  }));
  const chapters = shots.map((shot, index) => ({
    offsetTop: index * 1000,
    querySelector: () => shot,
  }));
  const owner = {
    dataset: {},
    style: style(),
    offsetHeight: 8000,
    querySelectorAll: () => chapters,
    getBoundingClientRect: () => ({ top: -sandbox.scrollY }),
  };
  const nodes = Object.fromEntries(
    [
      '.power-actor',
      '.power-factory-portal',
      '.power-site-portal',
      '.power-road',
      '.power-delivery-photo',
    ].map((selector) => [selector, { style: style() }]),
  );
  const world = {
    dataset: {},
    clientWidth: 1280,
    clientHeight: 720,
    closest: () => owner,
    querySelector: (selector) =>
      selector === 'canvas' ? canvas : nodes[selector],
  };
  class Observer {
    constructor() {
      observers++;
    }
    observe() {}
    disconnect() {
      observers--;
    }
  }
  const sandbox = {
    ...storyMath,
    AbortController,
    Date,
    innerWidth: 1280,
    scrollY: 1000,
    location: { hash: '' },
    performance: { getEntriesByType: () => [] },
    CustomEvent: class {},
    Event: class {},
    IntersectionObserver: Observer,
    ResizeObserver: Observer,
    matchMedia: (query) => ({
      matches: query.includes('prefers-reduced-motion') && reduced,
      addEventListener() {},
      removeEventListener() {},
    }),
    document: {
      querySelector: () => ({
        getBoundingClientRect: () => ({ bottom: 80 }),
      }),
      fonts: { ready: Promise.resolve() },
    },
    window: {
      addEventListener: (name, listener) => listeners.set(name, listener),
      removeEventListener: (name) => listeners.delete(name),
      dispatchEvent: () => true,
      setTimeout(callback) {
        const id = ++nextId;
        timers.set(id, callback);
        return id;
      },
    },
    clearTimeout: (id) => timers.delete(id),
    requestAnimationFrame(callback) {
      const id = ++nextId;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    useLanguage: () => ({ lang: 'zh' }),
    useRef(value) {
      const index = hookIndex++;
      hooks[index] ??= { current: index === 0 ? world : value };
      return hooks[index];
    },
    useState(initial) {
      const index = hookIndex++;
      hooks[index] ??= { kind: 'state', initial, value: initial };
      return [hooks[index].value, (value) => (hooks[index].value = value)];
    },
    useEffect(callback, deps) {
      const index = hookIndex++;
      const previous = hooks[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i]))
        hooks[index] = {
          kind: 'effect',
          callback,
          deps,
          cleanup: previous?.cleanup,
          pending: true,
        };
    },
    fetch(url, { signal }) {
      return new Promise((resolve, reject) => {
        const request = { url, signal, pending: true };
        request.finish = () => {
          if (!request.pending) return;
          request.pending = false;
          resolve({
            ok: true,
            json: async () => manifest,
            blob: async () => ({ url }),
          });
        };
        signal.addEventListener('abort', () => {
          if (!request.pending) return;
          request.pending = false;
          reject(new Error('Aborted'));
        });
        requests.push(request);
      });
    },
    createImageBitmap(blob, options) {
      return new Promise((resolve) => {
        const decode = { url: blob.url, pending: true };
        decode.finish = () => {
          if (!decode.pending) return;
          decode.pending = false;
          const image = {
            url: blob.url,
            width: options.resizeWidth,
            height: options.resizeHeight,
            closed: 0,
            close() {
              this.closed++;
            },
          };
          images.push(image);
          resolve(image);
        };
        decodes.push(decode);
      });
    },
  };
  const StoryStage = runInNewContext(
    `${runtime}\n${stageSource}\nStoryStage`,
    sandbox,
  );
  const render = (product) => {
    hookIndex = 0;
    StoryStage({ product, application: 'factory', industry: 'manufacturing' });
    for (const hook of hooks)
      if (hook.kind === 'effect' && hook.pending) {
        hook.cleanup?.();
        hook.pending = false;
        hook.cleanup = hook.callback();
      }
  };
  const settle = async () => {
    for (let i = 0; i < 16; i++) await Promise.resolve();
  };
  const flushFrame = async () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback());
    await settle();
  };
  const loadManifest = async () => {
    const request = requests.find(
      (entry) => entry.pending && entry.url.endsWith('manifest.json'),
    );
    assert.ok(request, 'the selected package must have a manifest request');
    request.finish();
    await settle();
    await flushFrame();
  };
  const downloadFrames = async () => {
    requests
      .filter((entry) => entry.pending && entry.url.endsWith('.webp'))
      .forEach((entry) => entry.finish());
    await settle();
  };
  const decodeFrame = async (suffix) => {
    const decode = decodes.find(
      (entry) => entry.pending && entry.url.endsWith(suffix),
    );
    assert.ok(decode, `expected a pending decode for ${suffix}`);
    decode.finish();
    await settle();
    await flushFrame();
  };
  t.after(async () => {
    hooks
      .filter((hook) => hook.kind === 'effect')
      .forEach((hook) => hook.cleanup?.());
    decodes
      .filter((decode) => decode.pending)
      .forEach((decode) => decode.finish());
    await settle();
    assert.ok(images.every((image) => image.closed === 1));
    assert.equal(frames.size, 0);
    assert.equal(timers.size, 0);
    assert.equal(observers, 0);
    assert.equal(listeners.size, 0);
    assert.equal(requests.filter((request) => request.pending).length, 0);
  });
  render('open-frame-small');
  return {
    render,
    settle,
    flushFrame,
    loadManifest,
    downloadFrames,
    decodeFrame,
    requests,
    decodes,
    images,
    paints,
    world,
    owner,
    loading: () =>
      hooks.find((hook) => hook.kind === 'state' && hook.initial === true)
        .value,
    observerCount: () => observers,
  };
}

test('a missing 2D context retains static content without downloading animation', async (t) => {
  const h = harness(t, { hasContext: false });
  h.render('silent');
  await h.settle();
  assert.equal(h.loading(), false);
  assert.equal(h.owner.dataset.enhanced, undefined);
  assert.equal(h.requests.length, 0);
  assert.equal(h.observerCount(), 0);
});

test('reduced-motion selection loads no frame bitmaps for either product', async (t) => {
  const h = harness(t, { reduced: true });
  await h.loadManifest();
  assert.equal(h.loading(), false);
  h.render('container');
  await h.loadManifest();
  assert.equal(h.world.dataset.product, 'container');
  assert.equal(h.loading(), false);
  assert.equal(h.decodes.length, 0);
  assert.ok(
    h.requests.every((request) => request.url.endsWith('manifest.json')),
  );
});

test('the first animation frame starts directly at the current product chapter', async (t) => {
  const h = harness(t);
  await h.loadManifest();
  await h.downloadFrames();
  await h.decodeFrame('frame-0025.webp');
  assert.deepEqual(h.paints, ['/media/story/motion/frame-0025.webp']);
  assert.equal(h.world.dataset.frame, '25');
  assert.equal(h.world.dataset.position, '1.000');
  assert.equal(h.loading(), false);
});

test('switching products releases old frames and rejects late decodes on the shared canvas', async (t) => {
  const h = harness(t);
  await h.loadManifest();
  await h.downloadFrames();
  await h.decodeFrame('frame-0025.webp');
  const oldPending = h.decodes.filter((decode) => decode.pending);
  const oldDownloads = h.requests.filter((request) => request.pending);
  assert.ok(oldPending.length > 0);
  assert.ok(oldDownloads.length > 0);
  h.render('silent');
  assert.equal(h.world.dataset.ready, 'false');
  assert.equal(h.world.dataset.product, 'silent');
  assert.equal(h.loading(), true);
  assert.ok(h.images.every((image) => image.closed === 1));
  assert.ok(oldDownloads.every((request) => request.signal.aborted));
  oldPending.forEach((decode) => decode.finish());
  await h.settle();
  await h.flushFrame();
  assert.ok(h.images.every((image) => image.closed === 1));
  assert.equal(h.paints.length, 1, 'old decodes must never repaint the stage');
  await h.loadManifest();
  await h.downloadFrames();
  await h.decodeFrame('frame-0025.webp');
  assert.equal(h.paints.at(-1), '/media/story/silent/motion/frame-0025.webp');
  assert.equal(h.world.dataset.frame, '25');
  assert.equal(h.world.dataset.product, 'silent');
  assert.equal(h.loading(), false);
});
