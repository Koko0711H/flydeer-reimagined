import test from 'node:test';
import assert from 'node:assert/strict';
import { productChapter, arcPose, clamp } from '../lib/motion-math.mjs';

test('five product chapters remain reachable through the whole scroll range', () => {
  const indices = new Set();
  for (let i = 0; i <= 1000; i++) {
    const { index, phase } = productChapter(i / 1000, 5);
    indices.add(index);
    assert.ok(index >= 0 && index < 5);
    assert.ok(phase >= 0 && phase <= 1);
  }
  assert.deepEqual([...indices], [0, 1, 2, 3, 4]);
  assert.deepEqual(productChapter(-1, 5), { index: 0, phase: 0 });
  assert.deepEqual(productChapter(1, 5), { index: 4, phase: 1 });
  assert.deepEqual(productChapter(9, 5), { index: 4, phase: 1 });
});

test('chapter buttons seek inside their own chapter rather than on an unstable boundary', () => {
  for (let index = 0; index < 5; index++) {
    const sample = productChapter((index + 0.35) / 5, 5);
    assert.equal(sample.index, index);
    assert.ok(Math.abs(sample.phase - 0.35) < 0.00001);
  }
});

test('spatial cases center the selected image and form a symmetric rounded-card arc', () => {
  for (const width of [285, 504, 590]) {
    const center = arcPose(3, 3, width);
    assert.equal(center.x, 0);
    assert.equal(Math.abs(center.z), 0);
    assert.equal(center.y, 0);
    assert.equal(center.opacity, 1);
    assert.equal(center.zIndex, 20);
    const left = arcPose(2, 3, width),
      right = arcPose(4, 3, width);
    assert.equal(left.x, -right.x);
    assert.equal(left.y, right.y);
    assert.equal(left.rotateY, -right.rotateY);
    assert.equal(left.rotateZ, -right.rotateZ);
  }
});

test('all gallery poses stay finite and distant cards do not intercept clicks', () => {
  for (let focus = 0; focus <= 6; focus += 0.05) {
    for (let index = 0; index < 7; index++) {
      const pose = arcPose(index, focus, 504);
      Object.values(pose).forEach((value) => assert.ok(Number.isFinite(value)));
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
      if (Math.abs(index - focus) >= 3.8) assert.equal(pose.opacity, 0);
    }
  }
  assert.equal(clamp(-2, 0, 6), 0);
  assert.equal(clamp(20, 0, 6), 6);
});
