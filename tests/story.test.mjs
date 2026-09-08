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
  assert.equal(manifest.version, 3);
  assert.equal(manifest.frameCount, 430);
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
