export const STORY_FRAMES = 144;
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
// Document chapters have different durations. Read stops hold the pose; camera
// moves live in the transitions. Every pose is a pure function for reverse seek.
export function storySourceFrame(value) {
  const keys = [
    [0, 1],
    [1.42, 1],
    [1.78, 21],
    [2.06, 29],
    [2.38, 29],
    [2.9, 42],
    [3.24, 42],
    [3.82, 58],
    [4.02, 67],
    [4.32, 85],
    [4.56, 94],
    [5.04, 110],
    [5.34, 110],
    [5.85, 144],
    [8, 144],
  ];
  if (!Number.isFinite(value) || value <= 0) return 1;
  for (let i = 1; i < keys.length; i++)
    if (value <= keys[i][0]) {
      const a = keys[i - 1],
        b = keys[i];
      return a[1] + (b[1] - a[1]) * clamp01((value - a[0]) / (b[0] - a[0]));
    }
  return 144;
}
export function storyFrame(value, count = STORY_FRAMES) {
  return Math.round(((storySourceFrame(value) - 1) * (count - 1)) / 143) + 1;
}
export function storyPose(value, portrait = false) {
  const x = trackAt(
    portrait
      ? [
          [0, 50],
          [1, 50],
          [1.4, 50],
          [2, 50],
          [2.4, 50],
          [3, 55],
          [3.5, 55],
          [4, 48],
          [4.6, 53],
          [5, 50],
          [5.4, 62],
          [5.9, 78],
          [6.35, 82],
          [7, 82],
        ]
      : [
          [0, 70],
          [0.45, 70],
          [1, 76],
          [1.4, 76],
          [2, 26],
          [2.4, 26],
          [3, 76],
          [3.5, 76],
          [4, 74],
          [4.6, 53],
          [5, 50],
          [5.4, 65],
          [5.9, 79],
          [6.35, 82],
          [7, 82],
        ],
    value,
  );
  const y = trackAt(
    portrait
      ? [
          [0, 69],
          [0.45, 69],
          [1, 78],
          [1.4, 78],
          [2, 29],
          [2.4, 29],
          [3, 76],
          [3.5, 76],
          [4, 58],
          [4.65, 53],
          [5, 39],
          [5.4, 39],
          [5.9, 33],
          [6.4, -55],
          [7, -55],
        ]
      : [
          [0, 70],
          [0.45, 70],
          [1, 58],
          [1.4, 58],
          [2, 54],
          [2.4, 49],
          [3, 56],
          [3.5, 56],
          [4, 66],
          [4.65, 55],
          [5, 33],
          [5.4, 33],
          [5.9, 44],
          [6.4, -60],
          [7, -60],
        ],
    value,
  );
  const width = trackAt(
    portrait
      ? [
          [0, 112],
          [0.5, 112],
          [1, 86],
          [1.4, 86],
          [2, 96],
          [2.4, 96],
          [3, 87],
          [3.5, 87],
          [4, 153],
          [4.65, 135],
          [5, 95],
          [5.4, 95],
          [5.85, 80],
          [6.4, 80],
        ]
      : [
          [0, 62],
          [0.45, 62],
          [1, 48],
          [1.4, 48],
          [2, 58],
          [2.4, 58],
          [3, 54],
          [3.5, 54],
          [4, 74],
          [4.65, 88],
          [5, 65],
          [5.4, 65],
          [5.85, 55],
          [6.4, 55],
        ],
    value,
  );
  return { x, y, width, opacity: 1 - ramp(value, 6.15, 6.4) };
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
