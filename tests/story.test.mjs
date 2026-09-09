import test from 'node:test';
import assert from 'node:assert/strict';
import { stat, readFile } from 'node:fs/promises';
import {
  STORY_FRAMES,
  STORY_IDS,
  storyFrame,
  storyPose,
  storyPosition,
  frameWindow,
  storySample,
  continuousTrack,
  STORY_CHAPTER_HEIGHT,
} from '../lib/story-math.mjs';

test('nonuniform document chapters support forward, reverse and direct seeks', () => {
  const offsets = [0, 1188, 2538, 4023, 5373, 7173, 8658, 10188, 11448];
  for (let chapter = 0; chapter < 8; chapter++) {
    assert.equal(storyPosition(offsets, offsets[chapter]), chapter);
    assert.equal(
      storyPosition(offsets, (offsets[chapter] + offsets[chapter + 1]) / 2),
      chapter + 0.5,
    );
  }
  assert.equal(storyPosition(offsets, -100), 0);
  assert.equal(storyPosition(offsets, 99999), 8);
  assert.equal(STORY_IDS.length, 8);
  const sequence = Array.from({ length: 8001 }, (_, i) => storyFrame(i / 1000));
  assert.equal(new Set(sequence).size, STORY_FRAMES);
  assert.deepEqual(
    sequence.slice().reverse(),
    Array.from({ length: 8001 }, (_, i) => storyFrame((8000 - i) / 1000)),
  );
  assert.equal(storyFrame(NaN), 1);
});

test('eight equally spaced chapters retain motion and continuous velocity', () => {
  assert.equal(STORY_CHAPTER_HEIGHT, 160);
  const offsets = Array.from({ length: 9 }, (_, i) => i * 1280);
  for (let chapter = 0; chapter < 8; chapter++) {
    assert.equal(storyPosition(offsets, offsets[chapter] + 640), chapter + 0.5);
    assert.ok(storySample(chapter + 1, 430) > storySample(chapter, 430));
  }
  let previous = 1;
  for (let i = 0; i <= 8000; i++) {
    const sample = storySample(i / 1000, 430);
    assert.ok(sample >= previous && sample >= 1 && sample <= 430);
    previous = sample;
  }
  const epsilon = 0.00001;
  for (const chapter of [1, 2, 3, 3.5, 4, 5, 6, 7]) {
    const readers = [
      (p) => storySample(p, 430),
      ...[false, true].flatMap((portrait) =>
        ['x', 'y', 'width'].map((key) => (p) => storyPose(p, portrait)[key]),
      ),
    ];
    for (const read of readers) {
      const left = (read(chapter) - read(chapter - epsilon)) / epsilon;
      const right = (read(chapter + epsilon) - read(chapter)) / epsilon;
      assert.ok(
        Math.abs(left - right) < 0.01,
        `velocity discontinuity at ${chapter}`,
      );
    }
  }
  // Camera reversals must not overshoot their authored positions.
  const keys = [
    [0, 0],
    [0.2, 5],
    [1, 6],
    [3, -2],
    [4, -2],
    [5, 10],
  ];
  for (let i = 1; i < keys.length; i++) {
    for (let step = 0; step <= 100; step++) {
      const p = keys[i - 1][0] + ((keys[i][0] - keys[i - 1][0]) * step) / 100;
      const value = continuousTrack(keys, p);
      assert.ok(value >= Math.min(keys[i - 1][1], keys[i][1]) - 1e-10);
      assert.ok(value <= Math.max(keys[i - 1][1], keys[i][1]) + 1e-10);
    }
  }
});

test('camera poses are finite and continuous through every chapter transition', () => {
  for (const portrait of [false, true]) {
    let previous = storyPose(0, portrait);
    for (let i = 0; i <= 8000; i++) {
      const pose = storyPose(i / 1000, portrait);
      Object.values(pose).forEach((value) => assert.ok(Number.isFinite(value)));
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
      assert.ok(pose.width > 0);
      for (const key of ['x', 'y', 'width'])
        assert.ok(Math.abs(pose[key] - previous[key]) < 1);
      previous = pose;
    }
  }
  assert.deepEqual(frameWindow(40, -1, 2), [40, 39, 41, 38, 42]);
  assert.deepEqual(frameWindow(1, 1, 2), [1, 2, 3]);
  assert.deepEqual(frameWindow(144, 1, 2), [144, 143, 142]);
});

test('the global story ships every manifest frame and a usable first-paint poster', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL('../public/media/story/manifest.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(manifest.version, 4);
  assert.equal(manifest.frameCount, 430);
  assert.deepEqual(manifest.framing, {
    baseWidth: 1000,
    baseHeight: 714,
    paddingTop: 2200,
    expandedThrough: 330,
  });
  const sequence = Array.from({ length: 8001 }, (_, i) =>
    storyFrame(i / 1000, manifest.frameCount),
  );
  assert.equal(new Set(sequence).size, manifest.frameCount);
  assert.deepEqual(
    sequence.slice().reverse(),
    Array.from({ length: 8001 }, (_, i) =>
      storyFrame((8000 - i) / 1000, manifest.frameCount),
    ),
  );
  for (let i = 1; i <= manifest.frameCount; i++)
    assert.ok(
      (
        await stat(
          new URL(
            `../public/media/story/motion/frame-${String(i).padStart(4, '0')}.webp`,
            import.meta.url,
          ),
        )
      ).size > 500,
    );
  assert.ok(
    (await stat(new URL('../public/media/story/poster.webp', import.meta.url)))
      .size > 500,
  );
});

test('expanded animation boundaries stay above the tested viewports', () => {
  for (const [viewportWidth, viewportHeight] of [
    [1280, 800],
    [1920, 1080],
    [390, 844],
    [430, 932],
    [760, 1024],
  ]) {
    const portrait = viewportWidth <= 760;
    for (let step = 0; step <= 8000; step++) {
      const pose = storyPose(step / 1000, portrait);
      const width =
        ((portrait ? Math.min(viewportWidth, 420) : viewportWidth) *
          pose.width) /
        100;
      const baseTop = (viewportHeight * pose.y) / 100 - width / 2.8;
      assert.ok(
        baseTop - width * 2.2 < 0,
        `Visible bitmap edge at ${viewportWidth}x${viewportHeight}, chapter ${step / 1000}`,
      );
    }
  }
});

test('all animation frames declare the expected expanded or original image dimensions', async () => {
  // VP8X and VP8L encode their dimensions in the file header. Checking the
  // actual delivered assets prevents a mixed build from stretching a frame.
  function dimensions(bytes) {
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    let offset = 12;
    while (offset < bytes.length) {
      const kind = bytes.toString('ascii', offset, offset + 4);
      const size = bytes.readUInt32LE(offset + 4);
      if (kind === 'VP8X')
        return [
          bytes.readUIntLE(offset + 12, 3) + 1,
          bytes.readUIntLE(offset + 15, 3) + 1,
        ];
      if (kind === 'VP8L') {
        const bits = bytes.readUInt32LE(offset + 9);
        return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
      }
      offset += 8 + size + (size % 2);
    }
    assert.fail('Missing WebP dimensions');
  }
  for (let i = 1; i <= 430; i++) {
    const bytes = await readFile(
      new URL(
        `../public/media/story/motion/frame-${String(i).padStart(4, '0')}.webp`,
        import.meta.url,
      ),
    );
    assert.deepEqual(
      dimensions(bytes),
      [1000, i <= 330 ? 2914 : 714],
      `frame ${i}`,
    );
  }
});
