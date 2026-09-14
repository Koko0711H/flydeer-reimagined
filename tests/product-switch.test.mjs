import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const source = stripTypeScriptTypes(
  await readFile(new URL('../lib/story-variants.ts', import.meta.url), 'utf8'),
).replaceAll('export ', '');

function harness() {
  const requests = [],
    starts = [],
    commits = [],
    errors = [];
  const api = runInNewContext(
    `${source}\n({ createStorySequenceLoader, storyAssetBase, isStoryProduct })`,
    {
      AbortController,
      fetch(url, { signal }) {
        return new Promise((resolve, reject) =>
          requests.push({ url, signal, resolve, reject }),
        );
      },
    },
  );
  const loader = api.createStorySequenceLoader({
    onStart: (product) => starts.push(product),
    onManifest: (manifest, product) => commits.push({ manifest, product }),
    onError: () => errors.push(true),
  });
  const settle = async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };
  const finish = (index, manifest) =>
    requests[index].resolve({ ok: true, json: async () => manifest });
  return { api, loader, requests, starts, commits, errors, settle, finish };
}

test('each selectable product resolves to its own complete animation package', () => {
  const { api } = harness();
  assert.equal(api.storyAssetBase('open-frame-small'), '/media/story');
  assert.equal(api.storyAssetBase('silent'), '/media/story/silent');
  assert.equal(api.storyAssetBase('container'), '/media/story/container');
  assert.equal(api.isStoryProduct('mobile'), false);
  assert.equal(api.isStoryProduct('../../other'), false);
  assert.equal(api.isStoryProduct(null), false);
});

test('rapid switching cannot restore an older product after a late response', async () => {
  const h = harness();
  h.loader.select('open-frame-small');
  h.loader.select('silent');
  h.loader.select('container');
  assert.ok(h.requests[0].signal.aborted);
  assert.ok(h.requests[1].signal.aborted);
  assert.equal(h.requests[2].signal.aborted, false);
  h.finish(2, { model: 'container' });
  await h.settle();
  h.finish(0, { model: 'open-frame-small' });
  h.finish(1, { model: 'silent' });
  await h.settle();
  assert.deepEqual(h.commits, [
    { manifest: { model: 'container' }, product: 'container' },
  ]);
  assert.equal(h.errors.length, 0);
});

test('the active button is inert and retry only reloads the selected product', async () => {
  const h = harness();
  h.loader.select('silent');
  h.loader.select('silent');
  assert.equal(h.requests.length, 1);
  h.requests[0].resolve({ ok: false });
  await h.settle();
  assert.equal(h.errors.length, 1);
  h.loader.retry();
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[1].url, '/media/story/silent/manifest.json');
  h.finish(1, { model: 'silent' });
  await h.settle();
  assert.equal(h.commits[0].product, 'silent');
});

test('switching back loads the original generator and ignores a cancelled failure', async () => {
  const h = harness();
  h.loader.select('container');
  h.loader.select('open-frame-small');
  h.requests[0].reject(new Error('late abort'));
  h.finish(1, { model: 'open-frame-small' });
  await h.settle();
  assert.equal(h.requests[1].url, '/media/story/manifest.json');
  assert.equal(h.commits[0].product, 'open-frame-small');
  assert.equal(h.errors.length, 0);
});

test('leaving the story releases the request and prevents late UI changes', async () => {
  const h = harness();
  h.loader.select('silent');
  h.loader.dispose();
  assert.ok(h.requests[0].signal.aborted);
  h.finish(0, { model: 'silent' });
  h.loader.select('container');
  h.loader.retry();
  await h.settle();
  assert.equal(h.requests.length, 1);
  assert.equal(h.commits.length, 0);
  assert.equal(h.errors.length, 0);
});
