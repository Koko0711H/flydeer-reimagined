import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const source = stripTypeScriptTypes(
  await readFile(new URL('../lib/frame-sequence.ts', import.meta.url), 'utf8'),
).replace(
  'export function createFrameSequence',
  'function createFrameSequence',
);

function harness(t, count = 24, framing) {
  let now = 0,
    nextId = 0;
  const timers = new Map(),
    rafs = new Map();
  const requests = [],
    decodes = [],
    images = [],
    paints = [],
    reports = [];
  const stack = [];
  const context = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    clearRect() {
      paints.push([]);
    },
    save() {
      stack.push([this.globalAlpha, this.globalCompositeOperation]);
    },
    restore() {
      [this.globalAlpha, this.globalCompositeOperation] = stack.pop();
    },
    drawImage(image, x, y) {
      assert.equal(image.closed, 0, 'must not draw a released bitmap');
      paints.at(-1).push({
        frame: image.frame,
        width: image.width,
        height: image.height,
        x,
        y,
        alpha: this.globalAlpha,
        operation: this.globalCompositeOperation,
      });
    },
  };
  const canvas = { width: 300, height: 150, getContext: () => context };
  const setTimer = (callback, delay) => {
    const id = ++nextId;
    timers.set(id, { callback, due: now + delay });
    return id;
  };
  const clearTimer = (id) => timers.delete(id);
  const create = runInNewContext(`${source}\ncreateFrameSequence`, {
    matchMedia: () => ({ matches: false }),
    window: { setTimeout: setTimer },
    clearTimeout: clearTimer,
    Date: { now: () => now },
    AbortController,
    requestAnimationFrame: (callback) => {
      const id = ++nextId;
      rafs.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => rafs.delete(id),
    fetch(url, { signal }) {
      assert.ok(
        requests.filter((entry) => entry.pending).length < 3,
        'at most three downloads',
      );
      assert.match(url, /^\/frames\/frame-\d{4}\.webp$/);
      const frame = Number(url.match(/frame-(\d+)/)[1]);
      assert.ok(Number.isInteger(frame) && frame >= 1 && frame <= count);
      return new Promise((resolve, reject) => {
        const request = {
          frame,
          signal,
          pending: true,
          finish() {
            if (!request.pending) return;
            request.pending = false;
            resolve({ ok: true, blob: async () => ({ frame }) });
          },
        };
        signal.addEventListener('abort', () => {
          if (!request.pending) return;
          request.pending = false;
          reject(new Error('aborted'));
        });
        requests.push(request);
      });
    },
    createImageBitmap(blob, options) {
      assert.ok(
        decodes.filter((entry) => entry.pending).length < 2,
        'at most two decoders',
      );
      return new Promise((resolve) => {
        const decode = {
          frame: blob.frame,
          width: options.resizeWidth,
          pending: true,
          finish() {
            if (!decode.pending) return;
            decode.pending = false;
            const image = {
              frame: blob.frame,
              width: options.resizeWidth,
              height: options.resizeHeight,
              closed: 0,
              close() {
                this.closed++;
              },
            };
            images.push(image);
            resolve(image);
          },
        };
        decodes.push(decode);
      });
    },
  });
  const player = create({
    canvas,
    count,
    prefix: '/frames/',
    framing,
    onFrame: (frame, stats) => reports.push({ frame, ...stats }),
    onUnavailable() {},
  });
  const microtasks = async () => {
    for (let i = 0; i < 12; i++) await Promise.resolve();
  };
  const finishAll = async () => {
    for (let i = 0; i < 200; i++) {
      requests
        .filter((entry) => entry.pending)
        .forEach((entry) => entry.finish());
      await microtasks();
      decodes
        .filter((entry) => entry.pending)
        .forEach((entry) => entry.finish());
      await microtasks();
      if (![...requests, ...decodes].some((entry) => entry.pending)) return;
    }
    assert.fail('download/decode queues failed to become idle');
  };
  const flushRAF = () => {
    const callbacks = [...rafs.values()];
    rafs.clear();
    callbacks.forEach((callback) => callback(now));
  };
  const advance = (duration) => {
    const until = now + duration;
    while (true) {
      const entry = [...timers]
        .filter(([, timer]) => timer.due <= until)
        .sort((a, b) => a[1].due - b[1].due)[0];
      if (!entry) break;
      const [id, timer] = entry;
      timers.delete(id);
      now = timer.due;
      timer.callback();
    }
    now = until;
  };
  t.after(async () => {
    player.dispose();
    decodes.filter((entry) => entry.pending).forEach((entry) => entry.finish());
    await microtasks();
    assert.ok(
      images.every((image) => image.closed === 1),
      'every bitmap is released once',
    );
    assert.equal(rafs.size, 0);
    assert.equal(timers.size, 0);
    for (const paint of paints) {
      assert.equal(
        paint.length,
        1,
        'every cleared canvas receives one complete frame',
      );
      assert.equal(paint[0].alpha, 1);
      assert.equal(paint[0].operation, 'source-over');
    }
  });
  return {
    player,
    canvas,
    context,
    requests,
    decodes,
    images,
    paints,
    reports,
    timers,
    rafs,
    advance,
    flushRAF,
    finishAll,
    microtasks,
  };
}

test('moving frames stay sharp with one opaque nearest-frame draw and no idle repaint', async (t) => {
  const h = harness(t);
  for (const sample of [20.3, 20.7]) {
    h.player.seek(sample);
    await h.finishAll();
    h.flushRAF();
    const paint = h.paints.at(-1);
    assert.equal(
      paint.length,
      1,
      'each clear must be followed by exactly one frame draw',
    );
    assert.equal(paint[0].frame, Math.round(sample));
    assert.equal(paint[0].alpha, 1);
    assert.equal(paint[0].operation, 'source-over');
    assert.equal(h.reports.at(-1).frame, Math.round(sample));
  }
  const paints = h.paints.length;
  h.advance(500);
  h.flushRAF();
  assert.equal(
    h.paints.length,
    paints,
    'stopping must not trigger a second sharpening draw',
  );
  assert.equal(h.rafs.size, 0);
  assert.equal(h.timers.size, 0);
});

test('reverse seeks prioritize nearby integer frames for fetch and decode', async (t) => {
  const h = harness(t);
  h.player.setActive(false);
  h.player.seek(20);
  h.player.seek(12.4);
  h.player.setActive(true);
  assert.deepEqual(
    h.requests.map((entry) => entry.frame),
    [12, 13, 11],
  );
  await h.finishAll();
  assert.deepEqual(
    h.decodes.slice(0, 2).map((entry) => entry.frame),
    [12, 13],
  );
  assert.equal(h.requests.length, 24);
  assert.equal(new Set(h.requests.map((entry) => entry.frame)).size, 24);
  const previous = h.decodes.length;
  h.player.resize(true);
  assert.deepEqual(
    h.decodes.slice(previous).map((entry) => entry.frame),
    [12, 13],
  );
  await h.finishAll();
  for (const frame of [0.2, NaN, Infinity, 1000]) h.player.seek(frame);
  await h.finishAll();
  assert.equal(h.requests.length, 24, 'cached frames are not fetched again');
});

test('seeks coalesce into one RAF and only repaint when the nearest frame changes', async (t) => {
  const h = harness(t);
  h.player.seek(12.4);
  await h.finishAll();
  assert.equal(h.rafs.size, 1);
  h.flushRAF();
  assert.deepEqual(
    h.paints.at(-1).map((draw) => draw.frame),
    [12],
  );
  assert.equal(h.context.globalAlpha, 1);
  assert.equal(h.context.globalCompositeOperation, 'source-over');
  assert.equal(h.reports.at(-1).frame, 12);
  const movingPaints = h.paints.length;
  h.advance(100);
  h.player.seek(12.4);
  h.player.seek(12.45);
  h.player.seek(12.46);
  assert.equal(h.rafs.size, 1);
  h.flushRAF();
  assert.equal(h.paints.length, movingPaints);
  h.player.seek(12.6);
  h.player.seek(12.7);
  assert.equal(h.rafs.size, 1);
  h.flushRAF();
  assert.deepEqual(
    h.paints.at(-1).map((draw) => draw.frame),
    [13],
  );
  assert.equal(h.paints.length, movingPaints + 1);
  assert.equal(h.reports.at(-1).frame, 13);
  h.advance(1000);
  h.player.seek(12.7);
  h.flushRAF();
  assert.equal(h.paints.length, movingPaints + 1);
  assert.equal(h.rafs.size, 0);
  assert.equal(h.timers.size, 0);
});

test('a late target frame replaces the available fallback with one opaque frame', async (t) => {
  const h = harness(t);
  h.player.seek(12.7);
  h.requests.find((entry) => entry.frame === 12).finish();
  await h.microtasks();
  h.decodes.find((entry) => entry.frame === 12).finish();
  await h.microtasks();
  h.flushRAF();
  assert.equal(h.reports.at(-1).frame, 12);
  const before = h.paints.length;
  h.advance(150);
  h.flushRAF();
  assert.equal(h.paints.length, before, 'idle does not repaint the fallback');
  await h.finishAll();
  h.flushRAF();
  assert.equal(h.paints.length, before + 1);
  assert.equal(h.reports.at(-1).frame, 13);
  assert.equal(h.rafs.size, 0);
});

test('deactivation cancels drawing and activation reuses blobs with a clear still frame', async (t) => {
  const h = harness(t);
  h.player.seek(12.4);
  await h.finishAll();
  h.flushRAF();
  const oldImages = [...h.images];
  h.player.seek(12.45);
  h.player.setActive(false);
  assert.equal(h.rafs.size, 0);
  assert.equal(h.timers.size, 0);
  assert.ok(oldImages.every((image) => image.closed === 1));
  h.player.seek(12.6);
  h.advance(500);
  assert.equal(h.rafs.size, 0);
  assert.equal(h.timers.size, 0);
  h.player.setActive(true);
  await h.finishAll();
  h.flushRAF();
  assert.equal(h.paints.at(-1).length, 1);
  assert.equal(h.reports.at(-1).frame, 13);
  assert.equal(h.requests.length, 24);
  const before = h.paints.length;
  h.player.seek(12.65);
  h.flushRAF();
  assert.equal(h.paints.length, before);
  h.player.seek(12.3);
  h.flushRAF();
  assert.equal(h.paints.at(-1).length, 1);
  assert.equal(h.reports.at(-1).frame, 12);
});

test('resize rejects old-size decodes and repaints one sharp frame without an idle redraw', async (t) => {
  const h = harness(t);
  h.player.seek(12.4);
  await h.finishAll();
  h.flushRAF();
  h.advance(100);
  h.player.resize(true);
  h.player.resize(false);
  await h.finishAll();
  h.flushRAF();
  const obsolete = h.images.filter((image) => image.width === 640);
  assert.equal(obsolete.length, 2);
  assert.ok(obsolete.every((image) => image.closed === 1));
  assert.equal(h.canvas.width, 1000);
  assert.ok(
    h.paints.every((paint) => paint.every((draw) => draw.width === 1000)),
  );
  assert.equal(h.paints.at(-1).length, 1);
  const before = h.paints.length;
  h.advance(50);
  h.flushRAF();
  assert.equal(h.paints.length, before);
  assert.equal(h.reports.at(-1).frame, 12);
  assert.equal(h.rafs.size, 0);
  assert.equal(h.timers.size, 0);
});

test('dispose cancels scheduled work, aborts downloads and closes late decoded images', async (t) => {
  const h = harness(t);
  h.player.seek(12.4);
  h.requests.find((entry) => entry.frame === 12).finish();
  await h.microtasks();
  assert.equal(h.decodes.length, 1);
  h.player.dispose();
  assert.ok(
    h.requests
      .filter((entry) => entry.frame !== 12)
      .every((entry) => entry.signal.aborted),
  );
  h.decodes[0].finish();
  await h.microtasks();
  h.advance(1000);
  h.flushRAF();
  h.player.seek(18.4);
  h.player.resize(true);
  h.player.setActive(false);
  h.player.setActive(true);
  h.player.retry();
  assert.equal(h.paints.length, 0);
  assert.equal(h.rafs.size, 0);
  assert.equal(h.timers.size, 0);
  assert.ok(h.images.every((image) => image.closed === 1));
});

const expandedFraming = {
  baseWidth: 1000,
  baseHeight: 714,
  paddingTop: 2200,
  expandedThrough: 330,
};

test('expanded and original frames switch at the same base-image position in both directions', async (t) => {
  const h = harness(t, 340, expandedFraming);
  h.player.seek(330.4);
  await h.finishAll();
  h.flushRAF();
  assert.equal(h.canvas.width, 1000);
  assert.equal(h.canvas.height, 2914);
  assert.equal(
    h.reports.at(-1).decoded,
    7,
    'expanded desktop cache reserves room for the previous visible frame',
  );
  const [expanded] = h.paints.at(-1);
  assert.deepEqual(
    [expanded.frame, expanded.height, expanded.x, expanded.y],
    [330, 2914, 0, 0],
  );
  assert.equal(h.reports.at(-1).frame, 330);

  h.player.seek(330.6);
  await h.finishAll();
  h.flushRAF();
  assert.equal(h.paints.at(-1).length, 1);
  const [original] = h.paints.at(-1);
  assert.deepEqual(
    [original.frame, original.height, original.x, original.y],
    [331, 714, 0, 2200],
  );
  assert.equal(
    expanded.y + 2200,
    original.y,
    'base image begins at the same pixel',
  );
  assert.equal(expanded.y + expanded.height, original.y + original.height);
  assert.equal(h.reports.at(-1).frame, 331);
  assert.equal(
    h.canvas.height,
    2914,
    'original frame keeps the expanded canvas',
  );

  h.player.seek(330);
  await h.finishAll();
  h.flushRAF();
  assert.equal(h.paints.at(-1)[0].frame, 330);
  assert.equal(h.paints.at(-1)[0].y, 0);
  assert.equal(
    h.canvas.height,
    2914,
    'reverse crossing does not resize the canvas',
  );
});

test('mobile expansion preserves scale and alignment while shrinking the decoded window', async (t) => {
  const h = harness(t, 340, expandedFraming);
  h.player.seek(330.4);
  await h.finishAll();
  h.flushRAF();
  const desktopImages = [...h.images];
  h.player.resize(true);
  await h.finishAll();
  h.flushRAF();
  assert.ok(desktopImages.every((image) => image.closed === 1));
  assert.equal(h.canvas.width, 640);
  assert.equal(h.canvas.height, 1865);
  assert.equal(
    h.reports.at(-1).decoded,
    5,
    'expanded mobile cache reserves room for the previous visible frame',
  );
  const [expanded] = h.paints.at(-1);
  assert.deepEqual(
    [expanded.width, expanded.height, expanded.y],
    [640, 1865, 0],
  );
  h.player.seek(330.6);
  await h.finishAll();
  h.flushRAF();
  const [original] = h.paints.at(-1);
  assert.deepEqual(
    [original.width, original.height, original.y],
    [640, 457, 1408],
  );
  assert.equal(expanded.y + 2200 * 0.64, original.y);
  assert.equal(expanded.y + expanded.height, original.y + original.height);
  assert.equal(h.paints.at(-1).length, 1);
  assert.equal(h.reports.at(-1).frame, 331);
  assert.equal(h.rafs.size, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.requests.length, 340, 'resizing reuses all compressed assets');
});

test('without expansion the original canvas sizes and cache radii are retained', async (t) => {
  const h = harness(t, 60);
  h.player.seek(30.4);
  await h.finishAll();
  h.flushRAF();
  assert.equal(h.canvas.width, 1000);
  assert.equal(h.canvas.height, 714);
  assert.equal(h.reports.at(-1).decoded, 25);
  assert.ok(
    h.paints.at(-1).every((draw) => draw.y === 0 && draw.height === 714),
  );
  h.player.resize(true);
  await h.finishAll();
  h.flushRAF();
  assert.equal(h.canvas.width, 640);
  assert.equal(h.canvas.height, 457);
  assert.equal(h.reports.at(-1).decoded, 13);
  assert.ok(
    h.paints.at(-1).every((draw) => draw.y === 0 && draw.height === 457),
  );
});

test('expanded cache budgets include the retained last frame during a distant seek', async (t) => {
  for (const mobile of [false, true]) {
    const h = harness(t, 340, expandedFraming);
    if (mobile) h.player.resize(true);
    h.player.seek(150.4);
    await h.finishAll();
    h.flushRAF();
    h.player.seek(200.4);
    await h.finishAll();
    // Before repainting, the old visible bitmap remains alongside the new
    // desired window. This is the largest retained set during a jump.
    const retained = h.images.filter((image) => image.closed === 0);
    assert.equal(retained.length, mobile ? 6 : 8);
    const bytes = retained.reduce(
      (sum, image) => sum + image.width * image.height * 4,
      0,
    );
    assert.ok(bytes <= (mobile ? 32 : 100) * 1024 * 1024);
    assert.ok(retained.every((image) => image.width === (mobile ? 640 : 1000)));
    h.flushRAF();
    h.advance(150);
    h.flushRAF();
    assert.equal(h.reports.at(-1).frame, 200);
    assert.equal(h.rafs.size, 0);
  }
});
