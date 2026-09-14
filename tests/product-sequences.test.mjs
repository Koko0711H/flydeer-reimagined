import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  createStoryCameraTrack,
  fitStoryCameraPose,
  storyPose,
  storyValueForSample,
} from '../lib/story-math.mjs';

const media = new URL('../public/media/story/', import.meta.url);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

for (const product of ['silent', 'container']) {
  test(`${product} ships the complete 430-frame journey with matching high resolution geometry`, async () => {
    const base = new URL(`${product}/`, media);
    const manifest = JSON.parse(
      await readFile(new URL('manifest.json', base), 'utf8'),
    );
    assert.equal(manifest.productId, product);
    assert.equal(manifest.frameCount, 430);
    assert.equal(manifest.version, 6);
    assert.deepEqual([manifest.width, manifest.height], [1000, 714]);
    for (const key of [
      'crops',
      'imageSizes',
      'desktopSubjectBounds',
      'desktopCameraFrames',
      'referenceCameraSpans',
    ])
      assert.equal(manifest[key].length, 430, `${product}: ${key}`);
    let totalBytes = 0;
    for (let frame = 1; frame <= 430; frame++) {
      const filename = `motion/frame-${String(frame).padStart(4, '0')}.webp`;
      const bytes = await readFile(new URL(filename, base));
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
      assert.ok(bytes.length > 500, `${product}: empty frame ${frame}`);
      assert.ok(
        bytes.length < 1024 * 1024,
        `${product}: oversized frame ${frame}`,
      );
      totalBytes += bytes.length;
      const crop = manifest.crops[frame - 1],
        size = manifest.imageSizes[frame - 1];
      assert.equal(crop.length, 4);
      assert.ok(crop.every(Number.isFinite));
      assert.ok(crop[2] > 0 && crop[3] > 0);
      assert.ok(size.every((n) => Number.isInteger(n) && n > 0 && n <= 4096));
      assert.ok(
        Math.max(...size) >= 1200,
        `${product}: native detail ${frame}`,
      );
      assert.ok(manifest.referenceCameraSpans[frame - 1] > 0);
    }
    assert.ok(totalBytes < 100 * 1024 * 1024);
    for (const name of [
      'poster',
      'frame-0001',
      'frame-0026',
      'frame-0034',
      'frame-0076',
      'frame-0110',
    ])
      assert.ok((await stat(new URL(`${name}.webp`, base))).size > 500);
    // The chosen type must change the actual lifting and loading pictures,
    // not merely the label or the product chapter's still image.
    for (const frame of ['0001', '0100', '0172']) {
      const name = `motion/frame-${frame}.webp`;
      assert.notEqual(
        digest(await readFile(new URL(name, base))),
        digest(await readFile(new URL(name, media))),
      );
    }
  });

  test(`${product} stays within desktop edges through forward and reverse neighboring frames`, async () => {
    const manifest = JSON.parse(
      await readFile(new URL(`${product}/manifest.json`, media), 'utf8'),
    );
    const track = createStoryCameraTrack(
      manifest.desktopSubjectBounds,
      manifest.desktopCameraFrames,
      manifest.referenceCameraSpans,
      product === 'container',
    );
    for (const [width, height] of [
      [1280, 720],
      [1440, 900],
      [1920, 800],
      [761, 900],
    ]) {
      for (let sample = 1; sample <= 430; sample += 0.5) {
        const value = storyValueForSample(sample, 430);
        for (const offset of [-4, 0, 4]) {
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
          const [left, top, right, bottom] =
            manifest.desktopSubjectBounds[frame - 1];
          const x1 = fit.x + (left * fit.width) / 1000,
            x2 = fit.x + (right * fit.width) / 1000;
          const y1 = fit.y + (top * fit.height) / 714,
            y2 = fit.y + (bottom * fit.height) / 714;
          const label = `${product} ${width}x${height} sample ${sample} displayed ${frame}`;
          if (product === 'container' && value <= 3.2)
            assert.ok(x1 >= width * 0.53 - 1e-5, `product text lane ${label}`);
          assert.ok(
            x1 >= 24 - 1e-5 && x2 <= width - 24 + 1e-5,
            `horizontal ${label}: ${x1}..${x2}`,
          );
          assert.ok(
            y1 >= 104 - 1e-5 && y2 <= height - 24 + 1e-5,
            `vertical ${label}: ${y1}..${y2}`,
          );
        }
      }
    }
  });
}
