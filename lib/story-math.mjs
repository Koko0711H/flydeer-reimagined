export const STORY_FRAMES = 144;
export const STORY_CHAPTER_HEIGHT = 160;
export const STORY_IDS = [
  'start',
  'products',
  'company',
  'showroom',
  'delivery',
  'industries',
  'cases',
  'contact',
];
export const clamp01 = (n) =>
  Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
export function ramp(value, start, end) {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
export function trackAt(keys, value) {
  if (!Number.isFinite(value) || value <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (value <= keys[i][0]) {
      const a = keys[i - 1],
        b = keys[i];
      return a[1] + (b[1] - a[1]) * ramp(value, a[0], b[0]);
    }
  }
  return keys[keys.length - 1][1];
}
// Monotone cubic interpolation keeps velocity continuous at chapter joins,
// without overshooting a physical action or changing order when scrolling back.
export function continuousTrack(keys, value) {
  if (!Number.isFinite(value) || value <= keys[0][0]) return keys[0][1];
  if (value >= keys.at(-1)[0]) return keys.at(-1)[1];
  const slopes = keys
    .slice(1)
    .map((key, i) => (key[1] - keys[i][1]) / (key[0] - keys[i][0]));
  const tangent = (i) => {
    if (i === 0) return slopes[0];
    if (i === keys.length - 1) return slopes.at(-1);
    const before = slopes[i - 1],
      after = slopes[i];
    if (before * after <= 0) return 0;
    const a = keys[i][0] - keys[i - 1][0];
    const b = keys[i + 1][0] - keys[i][0];
    return (3 * (a + b)) / ((2 * b + a) / before + (b + 2 * a) / after);
  };
  let i = 0;
  while (value > keys[i + 1][0]) i++;
  const a = keys[i],
    b = keys[i + 1],
    h = b[0] - a[0];
  const t = (value - a[0]) / h,
    t2 = t * t,
    t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * a[1] +
    (t3 - 2 * t2 + t) * h * tangent(i) +
    (-2 * t3 + 3 * t2) * b[1] +
    (t3 - t2) * h * tangent(i + 1)
  );
}
// One action per equally paced chapter. The final chapter completes the
// journey through camera movement and the delivery photograph.
export function storySourceFrame(value) {
  const keys = [
    [0, 1],
    [1, 9],
    [2, 18],
    [3, 34],
    [4, 58],
    [5, 95],
    [6, 111],
    [7, 132],
    [8, 144],
  ];
  return continuousTrack(keys, value);
}
export function storyFrame(value, count = STORY_FRAMES) {
  return Math.round(((storySourceFrame(value) - 1) * (count - 1)) / 143) + 1;
}
export function storySample(value, count = STORY_FRAMES) {
  return ((storySourceFrame(value) - 1) * (count - 1)) / 143 + 1;
}
export function storyPose(value, portrait = false) {
  // Keep the machine in a clear lane beside the text. Transport becomes the
  // page boundary, then the camera rises and carries it toward the destination.
  const nodes = portrait
    ? [
        [50, 70, 110],
        [50, 84, 83],
        [50, 32, 90],
        [50, 86, 84],
        [54, 63, 128],
        [50, 39, 96],
        [65, 24, 84],
        [83, 20, 46],
        [88, -18, 23],
      ]
    : [
        [68, 68, 60],
        [74, 61, 48],
        [71, 56, 54],
        [72, 58, 53],
        [71, 63, 67],
        [50, 34, 65],
        [69, 35, 60],
        [81, 31, 38],
        [87, -18, 22],
      ];
  const component = (index) =>
    continuousTrack(
      // Keep the full lifting rig below the mobile copy while its source
      // animation continues; approach the container as that copy fades.
      nodes.flatMap((p, i) =>
        portrait && i === 3
          ? [
              [i, p[index]],
              [3.5, p[index]],
            ]
          : [[i, p[index]]],
      ),
      value,
    );
  return {
    x: component(0),
    y: component(1),
    width: component(2),
    opacity: 1 - ramp(value, 7.3, 7.88),
  };
}
export function storyPosition(offsets, scroll) {
  let index = 0;
  for (let i = 1; i < offsets.length; i++) if (scroll >= offsets[i]) index = i;
  index = Math.min(index, offsets.length - 2);
  return (
    index +
    clamp01(
      (scroll - offsets[index]) /
        Math.max(1, offsets[index + 1] - offsets[index]),
    )
  );
}
export function frameWindow(frame, direction = 1, radius = 8) {
  const list = [frame];
  for (let d = 1; d <= radius; d++)
    for (const next of [frame + d * direction, frame - d * direction])
      if (next >= 1 && next <= STORY_FRAMES) list.push(next);
  return list;
}
