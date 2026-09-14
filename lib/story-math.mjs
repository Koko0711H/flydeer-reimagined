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
        [50, 71, 94],
        [50, 82, 88],
        [50, 34, 88],
        [50, 81, 88],
        [50, 70, 94],
        [50, 29, 88],
        [65, 23, 62],
        [74, 27, 38],
        [76, 27, 26],
      ]
    : [
        [75, 64, 48],
        [75, 61, 48],
        [75, 57, 48],
        [75, 62, 48],
        [53, 70, 66],
        [50, 33, 62],
        [72, 30, 48],
        [80, 32, 32],
        [82, 32, 22],
      ];
  const component = (index) =>
    continuousTrack(
      // Keep the full lifting rig below the mobile copy while its source
      // animation continues; approach the container as that copy fades.
      nodes.flatMap((p, i) =>
        !portrait && index === 0 && i === 3
          ? [
              [i, p[index]],
              [3.65, p[index]],
            ]
          : portrait && (i === 3 || i === 4)
            ? [
                [i, p[index]],
                [i === 3 ? 3.5 : 4.55, p[index]],
              ]
            : [[i, p[index]]],
      ),
      value,
    );
  return {
    x: component(0),
    y: component(1),
    width: component(2),
    clearance: portrait
      ? 0
      : 0.22 * ramp(value, 3.45, 4) * (1 - ramp(value, 4.55, 5)),
    opacity: 1 - ramp(value, 7.3, 7.88),
  };
}

// Keep the visible subject inside the stage. Transparent image margins can
// extend beyond the viewport, so they do not shrink the desktop assembly.
export function fitStoryPose(
  pose,
  viewportWidth,
  viewportHeight,
  headerBottom = 80,
  margin = 24,
  subject = [0, 0, 1000, 714],
) {
  const vw = Math.max(1, viewportWidth),
    vh = Math.max(1, viewportHeight);
  const gap = Math.min(Math.max(0, margin), vw / 4, vh / 4);
  const minimumHeight = Math.min(1, vh / 4);
  const header = Math.min(
    Math.max(0, headerBottom),
    Math.max(0, vh - 2 * gap - minimumHeight),
  );
  const clearance = Math.max(0, pose.clearance ?? 0) * vh;
  const top = Math.min(vh - gap - minimumHeight, header + gap + clearance);
  const availableWidth = vw - 2 * gap,
    availableHeight = vh - gap - top;
  const objectViewport = vw <= 760 ? Math.min(vw, 420) : vw;
  const subjectWidth = subject[2] - subject[0],
    subjectHeight = subject[3] - subject[1];
  const pixelsPerSourcePixel = Math.min(
    (objectViewport * pose.width) / 100 / subjectWidth,
    availableWidth / subjectWidth,
    availableHeight / subjectHeight,
  );
  const width = 1000 * pixelsPerSourcePixel,
    height = 714 * pixelsPerSourcePixel,
    visibleWidth = subjectWidth * pixelsPerSourcePixel,
    visibleHeight = subjectHeight * pixelsPerSourcePixel;
  const x =
    Math.max(
      gap,
      Math.min(vw - gap - visibleWidth, (vw * pose.x) / 100 - visibleWidth / 2),
    ) -
    subject[0] * pixelsPerSourcePixel;
  const y =
    Math.max(
      top,
      Math.min(
        vh - gap - visibleHeight,
        (vh * pose.y) / 100 - visibleHeight / 2,
      ),
    ) -
    subject[1] * pixelsPerSourcePixel;
  return { x, y, width, height, scale: width / vw, opacity: pose.opacity };
}

// Middle chapters size the visible assembly, not the transparent margins left
// by the source camera. The envelope anticipates incoming equipment; include
// the actually painted frame too when a decoder is catching up with a seek.
export function storyDesktopBounds(value, sample, bounds, displayed = sample) {
  if (!bounds.length) return [0, 0, 1000, 714];
  const index = Math.max(0, Math.min(bounds.length - 1, sample - 1));
  const low = Math.floor(index),
    high = Math.ceil(index),
    t = index - low;
  const actual =
    bounds[Math.max(0, Math.min(bounds.length - 1, Math.round(displayed) - 1))];
  const amount = ramp(value, 1.4, 1.95) * (1 - ramp(value, 4.7, 5.2));
  return [0, 0, 1000, 714].map((full, axis) => {
    const interpolated = bounds[low][axis] * (1 - t) + bounds[high][axis] * t;
    const safe =
      axis < 2
        ? Math.min(interpolated, actual[axis]) - 4
        : Math.max(interpolated, actual[axis]) + 4;
    return full * (1 - amount) + safe * amount;
  });
}

// The safety camera used to render each bitmap has its own zoom and pan.
// Recover its camera-plane coordinates before fitting the subject; fitting
// integer-frame pixel bounds would apply that camera a second time.
export function createStoryCameraTrack(
  bounds,
  cameras,
  referenceCameraSpans = [],
  reserveProductSpace = false,
) {
  if (!bounds.length || bounds.length !== cameras.length) return null;
  const physical = bounds.map((box, i) => {
    const [scale, x, y] = cameras[i];
    return box.map(
      (pixel, axis) =>
        ((pixel - (axis % 2 ? 357 : 500)) * scale) / 1000 + (axis % 2 ? -y : x),
    );
  });
  // A cubic B-spline uses four neighboring control boxes. Every control
  // contains six frames on either side, so their common region contains
  // the nearest bitmap and any decoder fallback up to four frames away.
  // Positive spline weights preserve that containment without clipping.
  const controls = physical.map((box, i) =>
    box.map((_, axis) => {
      const nearby = physical
        .slice(Math.max(0, i - 6), Math.min(physical.length, i + 7))
        .map((b) => b[axis]);
      return axis < 2
        ? Math.min(...nearby) - 0.025
        : Math.max(...nearby) + 0.025;
    }),
  );
  return {
    controls,
    cameras,
    reserveProductSpace,
    referenceCameraSpans:
      referenceCameraSpans.length === cameras.length &&
      referenceCameraSpans.every((span) => Number.isFinite(span) && span > 0)
        ? referenceCameraSpans
        : null,
    compositionCache: { key: '', rows: [] },
  };
}

function cameraSpline(rows, sample) {
  const index = Math.max(0, Math.min(rows.length - 1, sample - 1));
  const i = Math.floor(index),
    t = index - i,
    u = 1 - t;
  const weights = [
    (u * u * u) / 6,
    (3 * t * t * t - 6 * t * t + 4) / 6,
    (-3 * t * t * t + 3 * t * t + 3 * t + 1) / 6,
    (t * t * t) / 6,
  ];
  return rows[0].map((_, axis) =>
    weights.reduce(
      (sum, weight, j) =>
        sum +
        weight * rows[Math.max(0, Math.min(rows.length - 1, i + j - 1))][axis],
      0,
    ),
  );
}

// Plan the whole shot once per viewport. A newly visible truck must never
// redefine the generator's apparent size at the moment that it appears.
function storyComposition(track, viewportWidth, viewportHeight, headerBottom) {
  const key = `${viewportWidth}/${viewportHeight}/${headerBottom}`;
  if (track.compositionCache.key === key) return track.compositionCache.rows;
  const vw = Math.max(1, viewportWidth),
    vh = Math.max(1, viewportHeight);
  const gap = Math.min(24, vw / 4, vh / 4);
  const top = Math.min(Math.max(0, headerBottom) + gap, vh - gap - 1);
  const count = track.cameras.length,
    frameRatio = 429 / Math.max(1, count - 1);
  const frameAt = (source) => Math.round(((source - 1) * (count - 1)) / 143);
  const rows = track.controls.map((bounds, i) => {
    const value = storyValueForSample(i + 1, count),
      pose = storyPose(value);
    // The original source camera is the aesthetic reference. Width describes
    // that camera, rather than the ever-changing combined equipment bounds.
    const width = continuousTrack(
      [48, 48, 54, 53, 67, 65, 60, 38, 22].map((n, j) => [j, n]),
      value,
    );
    const desired = (vw * width) / 100 / track.referenceCameraSpans[i];
    // The full container is substantially larger than an open set. Reserve
    // the text column from the start, then release it as the loading shot
    // opens up; never let a newly selected container cover the controls.
    const left = track.reserveProductSpace
      ? gap + (vw * 0.53 - gap) * (1 - ramp(value, 3.3, 3.6))
      : gap;
    const industry = ramp(value, 4.55, 4.8) * (1 - ramp(value, 5.9, 6.2));
    const textTop = vh * (vw / vh >= 2 ? 0.72 : 0.61);
    const bottom =
      (vh - gap) * (1 - industry) + Math.max(top + 1, textTop - 26) * industry;
    return {
      bounds,
      pose,
      left,
      bottom,
      limit: Math.min(
        desired,
        (vw - gap - left) / (bounds[2] - bounds[0]),
        (bottom - top) / (bounds[3] - bounds[1]),
      ),
    };
  });
  const envelope = (values, step, minimum) => {
    const result = values.slice(),
      combine = minimum ? Math.min : Math.max;
    const offset = minimum ? step : -step;
    for (let i = 1; i < count; i++)
      result[i] = combine(result[i], result[i - 1] + offset);
    for (let i = count - 2; i >= 0; i--)
      result[i] = combine(result[i], result[i + 1] + offset);
    return result;
  };
  const rate = 0.012 * frameRatio;
  let zoom = envelope(
    rows.map((row) => Math.log(row.limit)),
    rate,
    true,
  );
  // Pull back through lift, rotation and insertion. Once the rig has departed,
  // the same bounded path can gently approach the departing truck again.
  for (let i = frameAt(18) + 1; i <= Math.min(count - 1, frameAt(72) + 2); i++)
    zoom[i] = Math.min(zoom[i], zoom[i - 1]);
  zoom = envelope(zoom, rate, true).map(Math.exp);
  const intervals = (axis, extent) => {
    const low = rows.map(
      (row, i) => (axis ? top : row.left) - zoom[i] * row.bounds[axis],
    );
    const high = rows.map(
      (row, i) =>
        (axis ? row.bottom : vw - gap) - zoom[i] * row.bounds[axis + 2],
    );
    let step = extent * 0.008 * frameRatio,
      before,
      after;
    // Extremely short windows may need a faster pan to retain containment.
    // Increase pan capacity only; the machine's scale is never changed here.
    do {
      before = envelope(low, step, false);
      after = envelope(high, step, true);
      step *= 2;
    } while (
      before.some((value, i) => value > after[i] + 1e-8) &&
      step < extent * count
    );
    return rows.map((row, i) =>
      Math.max(
        before[i],
        Math.min(after[i], (extent * (axis ? row.pose.y : row.pose.x)) / 100),
      ),
    );
  };
  const x = intervals(0, vw),
    y = intervals(1, vh);
  const composition = zoom.map((density, i) => [density, x[i], y[i]]);
  track.compositionCache = { key, rows: composition };
  return composition;
}

export function fitStoryCameraPose(
  pose,
  viewportWidth,
  viewportHeight,
  headerBottom,
  value,
  sample,
  track,
  displayed = sample,
) {
  if (!track)
    return fitStoryPose(pose, viewportWidth, viewportHeight, headerBottom);
  if (track.referenceCameraSpans) {
    const [density, originX, originY] = cameraSpline(
      storyComposition(track, viewportWidth, viewportHeight, headerBottom),
      sample,
    );
    const [scale, x, y] =
      track.cameras[
        Math.max(
          0,
          Math.min(track.cameras.length - 1, Math.round(displayed) - 1),
        )
      ];
    const width = density * scale;
    return {
      x: originX + density * (x - scale / 2),
      y: originY + density * (-y - scale * 0.357),
      width,
      height: width * 0.714,
      scale: width / Math.max(1, viewportWidth),
      opacity: pose.opacity,
    };
  }
  const targetCamera = cameraSpline(track.cameras, sample);
  const [scale, x, y] = targetCamera;
  const full = [
    x - scale / 2,
    -y - scale * 0.357,
    x + scale / 2,
    -y + scale * 0.357,
  ];
  const amount = ramp(value, 1.4, 1.95) * (1 - ramp(value, 4.7, 5.2));
  const subject = cameraSpline(track.controls, sample).map(
    (bound, axis) => full[axis] * (1 - amount) + bound * amount,
  );
  const fitted = fitStoryPose(
    pose,
    viewportWidth,
    viewportHeight,
    headerBottom,
    24,
    subject,
  );
  const painted =
    track.cameras[
      Math.max(0, Math.min(track.cameras.length - 1, Math.round(displayed) - 1))
    ];
  const pixelsPerUnit = fitted.width / 1000;
  // The industry copy sits below the truck. Move the continuous enclosure
  // upward without resizing it; its top bounds every nearby decoded pose.
  const safeLift = Math.max(
    0,
    fitted.y +
      cameraSpline(track.controls, sample)[1] * pixelsPerUnit -
      headerBottom -
      24,
  );
  const lift = Math.min(
    safeLift,
    viewportHeight *
      (0.14 + 0.04 * ramp(viewportWidth / viewportHeight, 2, 2.2)) *
      ramp(value, 4.55, 5) *
      (1 - ramp(value, 5.9, 6.2)),
  );
  const width = pixelsPerUnit * painted[0];
  // The continuous target camera never depends on decoder completion. Only
  // undo the painted bitmap's known safety camera here; physical animation
  // and the original scene camera's movement remain in that single bitmap.
  return {
    x: fitted.x + pixelsPerUnit * (painted[1] - painted[0] / 2),
    y: fitted.y + pixelsPerUnit * (-painted[2] - painted[0] * 0.357) - lift,
    width,
    height: width * 0.714,
    scale: width / Math.max(1, viewportWidth),
    opacity: pose.opacity,
  };
}

// A decoder stall may pause the camera, but must never rewind it to the last
// integer pose. Keep the last safe continuous sample until a nearby frame arrives.
export function advanceStoryCamera(target, value, displayed, previous) {
  return Math.abs(displayed - Math.round(target)) <= 4
    ? { sample: target, value }
    : previous;
}

export function storyValueForSample(sample, count = STORY_FRAMES) {
  const target = Math.max(
    1,
    Math.min(count, Number.isFinite(sample) ? sample : 1),
  );
  if (target === 1) return 0;
  if (target === count) return 8;
  let low = 0,
    high = 8;
  for (let i = 0; i < 40; i++) {
    const middle = (low + high) / 2;
    if (storySample(middle, count) < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
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
