import test from 'node:test';
import assert from 'node:assert/strict';
import { stat, readFile } from 'node:fs/promises';
import {
  STORY_FRAMES,
  STORY_IDS,
  storyFrame,
  storyPose,
  fitStoryPose,
  storyDesktopBounds,
  createStoryCameraTrack,
  fitStoryCameraPose,
  advanceStoryCamera,
  storyPosition,
  frameWindow,
  storySample,
  storyValueForSample,
  continuousTrack,
  STORY_CHAPTER_HEIGHT,
} from '../lib/story-math.mjs';

function cameraFixture() {
  const cameras = Array.from({ length: 60 }, (_, i) => [
    24 + Math.sin(i / 3) * 3,
    5 + Math.cos(i / 5),
    Math.sin(i / 7),
  ]);
  const bounds = cameras.map(([scale, x, y], i) =>
    [-2, -2, i >= 36 ? 12 : 2, 2].map(
      (unit, axis) =>
        ((unit - (axis % 2 ? -y : x)) * 1000) / scale + (axis % 2 ? 357 : 500),
    ),
  );
  return { cameras, bounds, track: createStoryCameraTrack(bounds, cameras) };
}

test('the same generator pulls back continuously from lifting into loading', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL('../public/media/story/manifest.json', import.meta.url),
      'utf8',
    ),
  );
  const track = createStoryCameraTrack(
    manifest.desktopSubjectBounds,
    manifest.desktopCameraFrames,
    manifest.referenceCameraSpans,
  );
  const density = (frame, width = 1920, height = 1080) => {
    const value = storyValueForSample(frame, manifest.frameCount);
    return (
      fitStoryCameraPose(
        storyPose(value),
        width,
        height,
        80,
        value,
        frame,
        track,
      ).width / manifest.desktopCameraFrames[frame - 1][0]
    );
  };
  // These are the same rigid generator's projected Blender dimensions, before
  // viewport composition. The truck's arrival must not redefine their scale.
  const beforeWidth = 3.797435760498047 * density(132);
  const afterWidth = 3.8489744663238525 * density(138);
  assert.ok(
    afterWidth / beforeWidth > 0.9,
    `generator shrank from ${beforeWidth}px to ${afterWidth}px across six frames`,
  );
  for (const [width, height] of [
    [1280, 720],
    [1920, 1080],
    [1920, 800],
  ]) {
    let previous = density(52, width, height);
    for (let frame = 53; frame <= 331; frame++) {
      const next = density(frame, width, height);
      if (frame <= 214)
        assert.ok(
          next <= previous * (1 + 1e-6),
          `zoom reverses at frame ${frame}`,
        );
      assert.ok(
        Math.abs(Math.log(next / previous)) <= 0.0121,
        `concentrated zoom at frame ${frame}`,
      );
      previous = next;
    }
  }
  assert.ok(
    density(100) * 2.59 > 350,
    'the front-facing generator still fills a useful part of the desktop',
  );
  assert.ok(
    density(283) > density(214) * 1.3,
    'the driving shot gradually returns toward the original camera',
  );
});

test('v6 industry truck has a readable scale and leaves a clear desktop text lane', async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL('../public/media/story/manifest.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(manifest.version, 6);
  const track = createStoryCameraTrack(
    manifest.desktopSubjectBounds,
    manifest.desktopCameraFrames,
    manifest.referenceCameraSpans,
  );
  for (const [width, height] of [
    [1280, 720],
    [1920, 1080],
    [1920, 800],
  ]) {
    const pickerTop = (width / height >= 2 ? 0.72 : 0.61) * height;
    const headingTop = (width / height >= 2 ? 0.72 : 0.63) * height;
    for (let step = 960; step <= 1180; step++) {
      const value = step / 200,
        sample = storySample(value, manifest.frameCount),
        frame = Math.round(sample);
      // Use the final fitting result without reproducing its lift in the test.
      const fit = fitStoryCameraPose(
        storyPose(value),
        width,
        height,
        80,
        value,
        sample,
        track,
        frame,
      );
      const bounds = manifest.desktopSubjectBounds[frame - 1].map(
        (pixel, axis) =>
          (pixel * fit.width) / 1000 + (axis % 2 ? fit.y : fit.x),
      );
      const label = `${width}x${height}, chapter ${value}, frame ${frame}`;
      assert.ok(
        bounds[0] >= 24 - 1e-6 && bounds[2] <= width - 24 + 1e-6,
        `horizontal model bounds: ${label}`,
      );
      assert.ok(
        bounds[1] >= 104 - 1e-6 && bounds[3] <= height - 24 + 1e-6,
        `vertical model bounds: ${label}`,
      );
      assert.ok(
        Math.min(pickerTop, headingTop) - bounds[3] >= 24 - 1e-6,
        `clear industry text lane: ${label}`,
      );
      if (value === 5) {
        const visibleWidth = bounds[2] - bounds[0];
        assert.ok(
          visibleWidth >= Math.min(width * 0.35, height * 0.6),
          `truck remains large enough to read: ${label}`,
        );
      }
    }
  }
});

test('a decoder falling behind pauses the continuous camera without rewinding at four frames', () => {
  const { cameras, track } = cameraFixture();
  const displayed = 35;
  let previous = { sample: 39.4999999, value: 3.5 };
  const before = fitStoryCameraPose(
    storyPose(3.5),
    1920,
    1080,
    80,
    3.5,
    previous.sample,
    track,
    displayed,
  );
  previous = advanceStoryCamera(39.5000001, 3.5, displayed, previous);
  const after = fitStoryCameraPose(
    storyPose(3.5),
    1920,
    1080,
    80,
    3.5,
    previous.sample,
    track,
    displayed,
  );
  assert.deepEqual(after, before);
  assert.equal(advanceStoryCamera(42, 3.6, displayed, previous), previous);
  assert.deepEqual(advanceStoryCamera(42, 3.6, 42, previous), {
    sample: 42,
    value: 3.6,
  });
  assert.deepEqual(advanceStoryCamera(41.8, 3.59, 42, previous), {
    sample: 41.8,
    value: 3.59,
  });
  assert.deepEqual(
    advanceStoryCamera(172.4, 4.004, 168, { sample: 1, value: 0 }),
    { sample: 172.4, value: 4.004 },
  );
  // A direct navigation holds both zoom sample and framing mode while the old
  // bitmap is visible. Resetting just the mode could crop a distant old frame.
  assert.equal(advanceStoryCamera(1, 0, displayed, previous), previous);
  assert.ok(cameras[displayed - 1][0] > 0);
});

test('decoded safety-camera changes cannot resize or move a stationary model', () => {
  const { cameras, track } = cameraFixture();
  const pose = storyPose(3.5);
  for (const sample of [12.49, 12.5, 20, 34.9, 38.1, 49.5]) {
    const reference = [];
    for (let offset = -4; offset <= 4; offset++) {
      const frame = Math.round(sample) + offset;
      const camera = cameras[frame - 1];
      const fit = fitStoryCameraPose(
        pose,
        1920,
        1080,
        80,
        3.5,
        sample,
        track,
        frame,
      );
      const k = fit.width / camera[0];
      // This is the same physical point after projecting into each source
      // image. Decoder completion may change the image rectangle, never it.
      const point = [
        fit.x + (camera[0] / 2 - camera[1]) * k,
        fit.y + (camera[0] * 0.357 + camera[2]) * k,
        k,
      ];
      if (!reference.length) reference.push(...point);
      else
        for (let axis = 0; axis < 3; axis++)
          assert.ok(Math.abs(point[axis] - reference[axis]) < 1e-8);
    }
  }
});

test('continuous camera fitting contains incoming equipment without a frame-boundary snap', () => {
  const { cameras, bounds, track } = cameraFixture();
  const pose = storyPose(3.5);
  const origin = (sample) => {
    const frame = Math.round(sample),
      camera = cameras[frame - 1];
    const fit = fitStoryCameraPose(
      pose,
      1920,
      1080,
      80,
      3.5,
      sample,
      track,
      frame,
    );
    const k = fit.width / camera[0];
    return [
      fit.x + (camera[0] / 2 - camera[1]) * k,
      fit.y + (camera[0] * 0.357 + camera[2]) * k,
      k,
    ];
  };
  for (let i = 6; i < 54; i++) {
    const before = origin(i + 0.5 - 1e-7),
      after = origin(i + 0.5 + 1e-7);
    assert.ok(Math.hypot(...before.map((v, axis) => after[axis] - v)) < 0.001);
    for (const sample of [i, i + 0.2, i + 0.5, i + 0.8])
      for (let offset = -4; offset <= 4; offset++) {
        const frame = Math.round(sample) + offset;
        const fit = fitStoryCameraPose(
          pose,
          1920,
          1080,
          80,
          3.5,
          sample,
          track,
          frame,
        );
        const pixels = bounds[frame - 1].map(
          (v, axis) => (v * fit.width) / 1000 + (axis % 2 ? fit.y : fit.x),
        );
        assert.ok(pixels[0] >= 24 - 1e-8 && pixels[2] <= 1896 + 1e-8);
        assert.ok(pixels[1] >= 104 - 1e-8 && pixels[3] <= 1056 + 1e-8);
      }
  }
  const fit = fitStoryCameraPose(pose, 1920, 1080, 80, 3.5, 20, track, 20);
  const visibleWidth = ((bounds[19][2] - bounds[19][0]) * fit.width) / 1000;
  assert.ok(
    visibleWidth > 900,
    'camera stability must retain the large desktop model',
  );
  assert.deepEqual(
    fitStoryCameraPose(pose, 1920, 1080, 80, 3.5, 20, null),
    fitStoryPose(pose, 1920, 1080, 80),
  );
});

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
  assert.ok([4, 5, 6].includes(manifest.version));
  assert.equal(manifest.frameCount, 430);
  assert.equal(manifest.referenceCameraSpans?.length, 430);
  assert.ok(
    manifest.referenceCameraSpans.every(
      (span) => Number.isFinite(span) && span > 0,
    ),
  );
  if (manifest.version >= 5) {
    assert.equal(manifest.width, 1000);
    assert.equal(manifest.height, 714);
    assert.equal(manifest.framing, undefined);
  } else {
    assert.deepEqual(manifest.framing, {
      baseWidth: 1000,
      baseHeight: 714,
      paddingTop: 2200,
      expandedThrough: 330,
    });
  }
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

test('the complete animation stays below the header and inside every viewport', () => {
  for (const [viewportWidth, viewportHeight] of [
    [1280, 720],
    [1440, 900],
    [1920, 1080],
    [1920, 800],
    [3440, 720],
    [390, 844],
    [430, 932],
    [760, 1024],
    [320, 1600],
    [240, 180],
  ]) {
    const portrait = viewportWidth <= 760;
    for (let step = 0; step <= 8000; step++) {
      const pose = storyPose(step / 1000, portrait);
      const fit = fitStoryPose(pose, viewportWidth, viewportHeight, 80);
      const label = `${viewportWidth}x${viewportHeight}, chapter ${step / 1000}`;
      assert.ok(fit.x >= 24 - 1e-8, `left edge: ${label}`);
      assert.ok(fit.y >= 104 - 1e-8, `header: ${label}`);
      assert.ok(
        fit.x + fit.width <= viewportWidth - 24 + 1e-8,
        `right edge: ${label}`,
      );
      assert.ok(
        fit.y + fit.height <= viewportHeight - 24 + 1e-8,
        `bottom edge: ${label}`,
      );
      assert.ok(Math.abs(fit.height / fit.width - 714 / 1000) < 1e-10);
      assert.ok(fit.width > 0 && fit.height > 0);
      assert.equal(fit.opacity, pose.opacity);
    }
  }
});

test('fitting respects a taller real header and keeps the departure visible until faded', () => {
  for (const [width, height] of [
    [1280, 720],
    [390, 844],
  ]) {
    const fitted = (value) =>
      fitStoryPose(storyPose(value, width <= 760), width, height, 132);
    const forward = Array.from({ length: 8001 }, (_, i) => fitted(i / 1000));
    assert.deepEqual(
      forward.slice().reverse(),
      Array.from({ length: 8001 }, (_, i) => fitted((8000 - i) / 1000)),
    );
    for (const fit of forward) {
      assert.ok(fit.y >= 156 - 1e-8);
      assert.ok(fit.y + fit.height <= height - 24 + 1e-8);
    }
    assert.ok(fitted(7.5).opacity > 0);
    assert.equal(fitted(7.88).opacity, 0);
    assert.equal(fitted(8).opacity, 0);
  }
});

test('fitting preserves right-hand product space and reserves the loading copy lane', () => {
  for (const [width, height] of [
    [1280, 720],
    [1440, 900],
    [1920, 800],
  ]) {
    for (let i = 0; i <= 300; i++) {
      const fit = fitStoryPose(storyPose(i / 100), width, height, 80);
      assert.ok(fit.x >= width / 2, `product copy lane at chapter ${i / 100}`);
    }
    const loading = fitStoryPose(storyPose(4), width, height, 80);
    assert.ok(loading.y >= 104 + height * 0.22 - 1e-8);
  }
  const mobileCompany = fitStoryPose(storyPose(2, true), 390, 844, 80);
  const mobileDetails = fitStoryPose(storyPose(3, true), 390, 844, 80);
  assert.ok(mobileCompany.y + mobileCompany.height < 450);
  assert.ok(mobileDetails.y > 540);
});

test('desktop subject fitting contains painted frames during scrolling, reverse seeks and jumps', async () => {
  const { desktopSubjectBounds: bounds } = JSON.parse(
    await readFile(
      new URL('../public/media/story/manifest.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(bounds.length, 430);
  for (const [width, height] of [
    [1280, 720],
    [1920, 1080],
    [1920, 800],
  ]) {
    for (let step = 0; step <= 1600; step++) {
      const value = step / 200;
      const sample = storySample(value, 430);
      for (const displayed of [
        1,
        430,
        Math.round(sample),
        Math.max(1, Math.round(sample) - 4),
        Math.min(430, Math.round(sample) + 4),
      ]) {
        const subject = storyDesktopBounds(value, sample, bounds, displayed);
        const fit = fitStoryPose(
          storyPose(value),
          width,
          height,
          80,
          24,
          subject,
        );
        const painted = bounds[displayed - 1];
        const scale = fit.width / 1000;
        const label = `${width}x${height}, ${value}, painted ${displayed}`;
        assert.ok(fit.x + painted[0] * scale >= 24 - 1e-8, `left ${label}`);
        assert.ok(
          fit.x + painted[2] * scale <= width - 24 + 1e-8,
          `right ${label}`,
        );
        assert.ok(fit.y + painted[1] * scale >= 104 - 1e-8, `header ${label}`);
        assert.ok(
          fit.y + painted[3] * scale <= height - 24 + 1e-8,
          `bottom ${label}`,
        );
      }
    }
  }
});

test('desktop middle chapters restore large visible machinery without changing the opening or mobile fit', async () => {
  const { desktopSubjectBounds: bounds } = JSON.parse(
    await readFile(
      new URL('../public/media/story/manifest.json', import.meta.url),
      'utf8',
    ),
  );
  for (const [width, height] of [
    [1280, 720],
    [1920, 1080],
  ]) {
    for (const [value, minimumGain] of [
      [2, 1.8],
      [3, 1.5],
      [3.5, 2.5],
      [4, 1.4],
    ]) {
      const sample = storySample(value, 430);
      const pose = storyPose(value);
      const previous = fitStoryPose(pose, width, height, 80);
      const enlarged = fitStoryPose(
        pose,
        width,
        height,
        80,
        24,
        storyDesktopBounds(value, sample, bounds),
      );
      assert.ok(
        enlarged.width / previous.width >= minimumGain,
        `chapter ${value} must not shrink`,
      );
    }
  }
  for (const value of [0, 1, 5.2, 6, 7, 8])
    assert.deepEqual(
      storyDesktopBounds(value, storySample(value, 430), bounds),
      [0, 0, 1000, 714],
    );
  assert.deepEqual(storyDesktopBounds(3, 100, []), [0, 0, 1000, 714]);
  const mobile = fitStoryPose(storyPose(3, true), 390, 844, 80);
  assert.equal(mobile.width, 390 - 2 * 24);
});

test('all animation frames declare the dimensions required by their manifest', async () => {
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
  const manifest = JSON.parse(
    await readFile(
      new URL('../public/media/story/manifest.json', import.meta.url),
      'utf8',
    ),
  );
  for (let i = 1; i <= manifest.frameCount; i++) {
    const bytes = await readFile(
      new URL(
        `../public/media/story/motion/frame-${String(i).padStart(4, '0')}.webp`,
        import.meta.url,
      ),
    );
    assert.deepEqual(
      dimensions(bytes),
      manifest.imageSizes?.[i - 1] ?? [
        1000,
        manifest.version === 4 && i <= 330 ? 2914 : 714,
      ],
      `frame ${i}`,
    );
  }
});

async function installedTightManifest(t) {
  const manifest = JSON.parse(
    await readFile(
      new URL('../public/media/story/manifest.json', import.meta.url),
      'utf8',
    ),
  );
  if (manifest.version < 6) {
    t.skip('The complete v6 tight-frame sequence has not been installed yet.');
    return null;
  }
  return manifest;
}

test('v6 delivers complete crop geometry and enough native pixels for the enlarged machinery', async (t) => {
  const manifest = await installedTightManifest(t);
  if (!manifest) return;
  assert.equal(manifest.frameCount, 430);
  assert.deepEqual([manifest.width, manifest.height], [1000, 714]);
  for (const [key, columns] of [
    ['crops', 4],
    ['imageSizes', 2],
    ['desktopSubjectBounds', 4],
    ['desktopCameraFrames', 3],
  ]) {
    assert.equal(manifest[key]?.length, 430, `${key} must cover every frame`);
    for (const [index, row] of manifest[key].entries()) {
      assert.equal(row.length, columns, `${key}, frame ${index + 1}`);
      assert.ok(row.every(Number.isFinite), `${key}, frame ${index + 1}`);
    }
  }
  for (let index = 0; index < 430; index++) {
    const label = `frame ${index + 1}`;
    const [x, y, width, height] = manifest.crops[index];
    const [nativeWidth, nativeHeight] = manifest.imageSizes[index];
    const [left, top, right, bottom] = manifest.desktopSubjectBounds[index];
    assert.ok(width > 0 && height > 0, `positive crop: ${label}`);
    assert.ok(left < right && top < bottom, `positive subject: ${label}`);
    assert.ok(
      [nativeWidth, nativeHeight].every(
        (number) => Number.isInteger(number) && number > 0 && number <= 4096,
      ),
      `native dimensions: ${label}`,
    );
    assert.ok(manifest.desktopCameraFrames[index][0] > 0, `camera: ${label}`);
    const pixels = [
      ((left - x) * nativeWidth) / width,
      ((top - y) * nativeHeight) / height,
      ((right - x) * nativeWidth) / width,
      ((bottom - y) * nativeHeight) / height,
    ];
    assert.ok(
      pixels[0] >= -1e-6 &&
        pixels[1] >= -1e-6 &&
        pixels[2] <= nativeWidth + 1e-6 &&
        pixels[3] <= nativeHeight + 1e-6,
      `all visible pixels belong inside the delivered crop: ${label}`,
    );
    assert.ok(
      Math.abs(nativeWidth * height - nativeHeight * width) /
        Math.max(nativeWidth * height, nativeHeight * width) <
        1e-5,
      `crop-to-image mapping must not distort the machinery: ${label}`,
    );
    // The previous full-frame export left some middle models just 250 px
    // tall. The new export must provide real subject detail, not merely a
    // large transparent image. Current rendered keyframes exceed 1460 px.
    assert.ok(
      Math.max(pixels[2] - pixels[0], pixels[3] - pixels[1]) >= 1200,
      `the visible subject needs at least 1200 native pixels: ${label}`,
    );
  }
});

test('the v6 camera keeps real cropped assets inside desktop edges without decoder-induced motion', async (t) => {
  const manifest = await installedTightManifest(t);
  if (!manifest) return;
  const {
    crops,
    imageSizes,
    desktopSubjectBounds: bounds,
    desktopCameraFrames: cameras,
  } = manifest;
  const track = createStoryCameraTrack(
    bounds,
    cameras,
    manifest.referenceCameraSpans,
  );
  assert.ok(track);
  const keyFrames = [
    1, 52, 63, 66, 100, 132, 142, 143, 172, 205, 224, 254, 283, 331, 398, 430,
  ];
  for (const keyFrame of keyFrames) {
    for (const fraction of [0, 0.4999999, 0.5000001]) {
      const sample = Math.min(430, keyFrame + fraction);
      let low = 0,
        high = 8;
      for (let i = 0; i < 40; i++) {
        const middle = (low + high) / 2;
        if (storySample(middle, 430) < sample) low = middle;
        else high = middle;
      }
      const value = (low + high) / 2;
      for (const [width, height] of [
        [1280, 720],
        [1920, 1080],
        [1920, 800],
        [3440, 720],
      ]) {
        let reference;
        for (let offset = -4; offset <= 4; offset++) {
          const frame = Math.max(1, Math.min(430, Math.round(sample) + offset));
          const fit = fitStoryCameraPose(
            storyPose(value),
            width,
            height,
            80,
            value,
            sample,
            track,
            frame,
          );
          const [cropX, cropY, cropWidth, cropHeight] = crops[frame - 1];
          const [nativeWidth, nativeHeight] = imageSizes[frame - 1];
          // Follow a point through the source crop, native bitmap, and its
          // CSS rectangle. This catches the 714-vs-1000 vertical denominator
          // error as well as a mismatched source-camera transform.
          const screenPoint = ([x, y]) => [
            fit.x +
              (cropX * fit.width) / 1000 +
              (((x - cropX) * nativeWidth) / cropWidth / nativeWidth) *
                ((cropWidth * fit.width) / 1000),
            fit.y +
              (cropY * fit.height) / 714 +
              (((y - cropY) * nativeHeight) / cropHeight / nativeHeight) *
                ((cropHeight * fit.height) / 714),
          ];
          const [left, top, right, bottom] = bounds[frame - 1];
          const [screenLeft, screenTop] = screenPoint([left, top]);
          const [screenRight, screenBottom] = screenPoint([right, bottom]);
          const label = `${width}x${height}, sample ${sample}, bitmap ${frame}`;
          assert.ok(
            screenLeft >= 24 - 1e-6 && screenRight <= width - 24 + 1e-6,
            `horizontal containment: ${label}`,
          );
          assert.ok(
            screenTop >= 104 - 1e-6 && screenBottom <= height - 24 + 1e-6,
            `vertical containment: ${label}`,
          );
          const [scale, cameraX, cameraY] = cameras[frame - 1];
          const physicalPoints = [
            [0, 0],
            [0.25, -0.75],
          ].flatMap(([x, y]) =>
            screenPoint([
              ((x - cameraX) * 1000) / scale + 500,
              ((y + cameraY) * 1000) / scale + 357,
            ]),
          );
          if (!reference) reference = physicalPoints;
          else
            physicalPoints.forEach((point, axis) =>
              assert.ok(
                Math.abs(point - reference[axis]) < 1e-6,
                `a late bitmap cannot move a physical point: ${label}`,
              ),
            );
        }
      }
    }
  }
});
