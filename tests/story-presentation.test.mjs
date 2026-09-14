import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import * as storyMath from '../lib/story-math.mjs';

const playerSource = stripTypeScriptTypes(
  await readFile(new URL('../lib/frame-sequence.ts', import.meta.url), 'utf8'),
).replace(
  'export function createFrameSequence',
  'function createFrameSequence',
);
const stageSource = stripTypeScriptTypes(
  (
    await readFile(
      new URL('../components/site/story-stage.tsx', import.meta.url),
      'utf8',
    )
  ).split('  return (\n    <>')[0] + '\n}',
);
// Execute the production stage seek body rather than a test-only replica of
// its presentation policy. Surrounding DOM effects use inert style objects.
const stageSeek = stageSource.slice(
  stageSource.indexOf('const seek ='),
  stageSource.indexOf('const schedule ='),
);
const bindStageSource = `
  (function bindStage(player) {
    let raf = 0, disposed = false, modeChanging = false, reduced = false,
        inView = true, frameUnavailable = false, value = 0, target = 1,
        active = -1, scrollY = 0, frameCount = 430, viewportWidth = 1280,
        presentation = { sample: 1, value: 0, recovering: false },
        presentationTime = 0, presentationInitialized = false, navigationGoal = null;
    const offsets = Array.from({ length: 9 }, (_, i) => i * 1000),
          cameraTrack = {}, shots = [], shotHeights = [],
          factory = { style: {} }, destination = { style: {} },
          road = { style: {} }, delivery = { style: {} },
          owner = { dataset: {} }, world = { dataset: {} },
          placeActor = () => {}, schedule = () => {};
    ${stageSeek}
    return (sample, now) => {
      scrollY = storyValueForSample(sample, frameCount) * 1000;
      seek(now);
      return presentation;
    };
  })
`;
const manifest = JSON.parse(
  await readFile(
    new URL('../public/media/story/manifest.json', import.meta.url),
    'utf8',
  ),
);

async function measureStage({
  rate,
  decodeMs,
  stallAt = Infinity,
  stallMs = 0,
  duration = 3,
}) {
  const interval = 1000 / 60,
    warmMs = 1600;
  let now = 0,
    nextId = 0,
    displayed = 60,
    activeDecodes = 0;
  const events = new Map(),
    paints = [],
    bitmaps = [],
    decodeHistory = [];
  const later = (callback, delay) => {
    const id = ++nextId;
    events.set(id, { due: now + delay, callback });
    return id;
  };
  const clear = (id) => events.delete(id);
  const context = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    clearRect() {},
    drawImage(image) {
      assert.equal(image.closed, false);
      assert.equal(this.globalAlpha, 1);
      assert.equal(this.globalCompositeOperation, 'source-over');
    },
  };
  const sandbox = {
    ...storyMath,
    innerWidth: 1280,
    CustomEvent: class {},
    window: { setTimeout: later, dispatchEvent() {} },
    matchMedia: () => ({ matches: false }),
    clearTimeout: clear,
    Date: { now: () => now },
    AbortController,
    requestAnimationFrame: (callback) =>
      later(
        () => callback(now),
        Math.floor(now / interval + 1 + 1e-8) * interval - now,
      ),
    cancelAnimationFrame: clear,
    fetch(url) {
      const frame = Number(url.match(/frame-(\d+)/)[1]);
      return new Promise((resolve) =>
        later(() => resolve({ ok: true, blob: async () => ({ frame }) }), 2),
      );
    },
    createImageBitmap(blob, options) {
      activeDecodes++;
      assert.ok(activeDecodes <= 2);
      decodeHistory.push(blob.frame);
      const delayed =
        now >= warmMs + stallAt && now < warmMs + stallAt + stallMs;
      return new Promise((resolve) =>
        later(
          () => {
            activeDecodes--;
            const image = {
              frame: blob.frame,
              width: options.resizeWidth,
              height: options.resizeHeight,
              closed: false,
              close() {
                this.closed = true;
              },
            };
            bitmaps.push(image);
            resolve(image);
          },
          decodeMs + (delayed ? stallMs : 0),
        ),
      );
    },
  };
  const create = runInNewContext(
    `${playerSource}\ncreateFrameSequence`,
    sandbox,
  );
  const player = create({
    canvas: { width: 300, height: 150, style: {}, getContext: () => context },
    count: 430,
    prefix: '/frames/',
    crops: manifest.crops,
    imageSizes: manifest.imageSizes,
    onFrame(frame) {
      displayed = frame;
      paints.push({ time: now, frame });
    },
    onUnavailable() {},
  });
  const stage = runInNewContext(bindStageSource, sandbox)(player);
  async function advance(until) {
    while (true) {
      const entry = [...events]
        .filter(([, event]) => event.due <= until + 1e-8)
        .sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0];
      if (!entry) break;
      events.delete(entry[0]);
      now = entry[1].due;
      entry[1].callback();
      for (let i = 0; i < 12; i++) await Promise.resolve();
    }
    now = until;
  }
  try {
    stage(60, 0);
    await advance(warmMs - interval);
    stage(60, warmMs - interval);
    await advance(warmMs);
    let maxLag = 0,
      previous = displayed,
      lastChange = warmMs,
      maxFreezeMs = 0;
    for (let tick = 1; tick <= duration * 60; tick++) {
      await advance(warmMs + tick * interval);
      const requested = 60 + (tick * rate) / 60;
      stage(requested, now);
      maxLag = Math.max(maxLag, requested - displayed);
      if (displayed !== previous) {
        maxFreezeMs = Math.max(maxFreezeMs, now - lastChange);
        lastChange = now;
        previous = displayed;
      }
    }
    maxFreezeMs = Math.max(maxFreezeMs, now - lastChange);
    const moving = paints.filter((paint) => paint.time > warmMs);
    assert.ok(
      moving.every((paint, i) => !i || paint.frame >= moving[i - 1].frame),
      'asynchronous decodes must not make forward scrolling reverse',
    );
    return {
      drawFPS: moving.length / duration,
      finalFrameLag: 60 + duration * rate - displayed,
      maxLag,
      maxFreezeMs,
      decodes: decodeHistory.length,
    };
  } finally {
    player.dispose();
    await advance(now + 200);
    assert.ok(bitmaps.every((image) => image.closed));
  }
}

test('presentation inverse matches the nonlinear story in both frame counts', () => {
  for (const count of [144, 430])
    for (let i = 0; i <= 1600; i++) {
      const value = i / 200;
      assert.ok(
        Math.abs(
          storyMath.storyValueForSample(
            storyMath.storySample(value, count),
            count,
          ) - value,
        ) < 1e-8,
      );
    }
});

test('the actual stage follows sustained normal and fast scrolling without a playback speed cap', async () => {
  for (const rate of [60, 120]) {
    const result = await measureStage({ rate, decodeMs: 12 });
    assert.ok(
      result.drawFPS >= 55,
      `${rate} source frames/s: ${JSON.stringify(result)}`,
    );
    assert.ok(
      result.finalFrameLag <= 4,
      `scroll position remains current: ${JSON.stringify(result)}`,
    );
    assert.ok(
      result.maxFreezeMs <= 50,
      `no intermittent waiting: ${JSON.stringify(result)}`,
    );
  }
});

test('a brief decoder stall cannot leave the actual stage permanently replaying old frames', async () => {
  const result = await measureStage({
    rate: 120,
    decodeMs: 3,
    stallAt: 500,
    stallMs: 70,
  });
  assert.ok(
    result.finalFrameLag <= 8,
    `recovered decoders must catch current scroll: ${JSON.stringify(result)}`,
  );
  assert.ok(
    result.drawFPS >= 55,
    `frame presentation must resume promptly: ${JSON.stringify(result)}`,
  );
  assert.ok(
    result.maxFreezeMs <= 100,
    `a brief stall must not grow: ${JSON.stringify(result)}`,
  );
});

test('the actual stage uses available decoder throughput instead of waiting for every exact target', async () => {
  const result = await measureStage({ rate: 60, decodeMs: 40 });
  assert.ok(
    result.drawFPS >= 45,
    `two 40ms decoders provide about 50 frames/s: ${JSON.stringify(result)}`,
  );
  assert.ok(
    result.finalFrameLag <= 4,
    `frames may be skipped to follow scroll: ${JSON.stringify(result)}`,
  );
  assert.ok(
    result.maxFreezeMs <= 50,
    `available neighboring poses keep moving: ${JSON.stringify(result)}`,
  );
});
