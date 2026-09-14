import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'dist/client');
const ids = [
  'silent',
  'open-frame',
  'open-frame-small',
  'container',
  'mobile',
  'high-voltage',
];
const routes = [
  'index',
  'about',
  'cases',
  'news',
  'products',
  'service',
  'showroom',
  '404',
  ...ids.map((id) => `products/${id}`),
];
test('all 14 static routes have content and a branded title', async () => {
  for (const route of routes) {
    const html = await readFile(path.join(output, `${route}.html`), 'utf8');
    assert.match(html, /<main[^>]+id="main"/);
    assert.match(html, /<title>[^<]*FRS POWER/);
    assert.ok(html.length > 1000);
  }
});
test('the homepage offers exactly the three product families and starts with the refined open set', async () => {
  const html = await readFile(path.join(output, 'index.html'), 'utf8');
  const selected = [...html.matchAll(/data-product-id="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(selected, ['open-frame-small', 'silent', 'container']);
  assert.match(html, /data-product="open-frame-small"/);
  for (const label of [
    '开架发电机组',
    '静音箱发电机组',
    '集装箱发电机组',
    '按项目配置',
  ])
    assert.ok(html.includes(label));
});
test('all emitted local HTML asset and page links resolve', async () => {
  for (const route of routes) {
    const html = await readFile(path.join(output, `${route}.html`), 'utf8');
    const links = [...html.matchAll(/(?:src|href)="(\/[^"\s]*)"/g)].map(
      (match) => match[1],
    );
    for (const link of links) {
      const pathname = decodeURIComponent(link.split(/[?#]/)[0]);
      if (pathname.startsWith('//')) continue;
      const candidates =
        pathname === '/'
          ? ['index.html']
          : [
              pathname.slice(1),
              `${pathname.slice(1)}.html`,
              `${pathname.slice(1)}/index.html`,
            ];
      let found = false;
      for (const candidate of candidates) {
        try {
          if ((await stat(path.join(output, candidate))).isFile()) {
            found = true;
            break;
          }
        } catch {}
      }
      assert.ok(found, `${route}: missing ${pathname}`);
    }
  }
});
test('contact information remains unchanged', async () => {
  const html = await readFile(path.join(output, 'service.html'), 'utf8');
  for (const expected of [
    '+86 182 0593 8836',
    'flydeerpower@googlel.com',
    '8618205938836',
    '仓山智能产业园',
  ])
    assert.ok(html.includes(expected), `Missing original contact: ${expected}`);
});
test('all product models are self-contained GLB files', async () => {
  for (const id of ids) {
    const binary = await readFile(
      path.join(root, `public/media/models/${id}.glb`),
    );
    assert.equal(binary.toString('ascii', 0, 4), 'glTF');
    assert.equal(binary.readUInt32LE(4), 2);
    assert.equal(binary.readUInt32LE(8), binary.length);
    const json = JSON.parse(
      binary.toString('utf8', 20, 20 + binary.readUInt32LE(12)).trim(),
    );
    for (const item of [...(json.buffers ?? []), ...(json.images ?? [])])
      assert.ok(
        !item.uri || item.uri.startsWith('data:'),
        `${id}: external model dependency`,
      );
  }
});
test('public assets fit the static hosting individual-file limit', async () => {
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(p);
      else
        assert.ok(
          (await stat(p)).size < 25 * 1024 * 1024,
          `Asset exceeds 25 MiB: ${p}`,
        );
    }
  }
  await walk(path.join(root, 'public'));
});
