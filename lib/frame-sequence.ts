// Encoded frames are cheap to retain. Decoding is a separate, bounded queue;
// normal scroll never cancels a decoder or repeats a network request.
export function createFrameSequence({
  canvas,
  count,
  prefix,
  framing,
  onFrame,
  onUnavailable,
}: {
  canvas: HTMLCanvasElement;
  count: number;
  prefix: string;
  framing?: {
    baseWidth: number;
    baseHeight: number;
    paddingTop: number;
    expandedThrough: number;
  };
  onFrame: (
    frame: number,
    stats: { decoded: number; encoded: number; misses: number; draws: number },
  ) => void;
  onUnavailable: (failed: boolean) => void;
}) {
  const context = canvas.getContext('2d');
  const baseWidth = framing?.baseWidth ?? 1000,
    baseHeight = framing?.baseHeight ?? 714,
    paddingTop = framing?.paddingTop ?? 0,
    expandedThrough = framing?.expandedThrough ?? 0;
  const blobs = new Map<number, Blob>();
  const bitmaps = new Map<number, ImageBitmap>();
  const downloading = new Map<number, AbortController>();
  const decoding = new Set<number>();
  const failures = new Map<number, number>();
  const retries = new Map<number, number>();
  let target = 1,
    sample = 1,
    started = false,
    drawnSignature = '',
    direction = 1,
    drawn = -1,
    raf = 0,
    timer = 0,
    disposed = false,
    active = true,
    draws = 0,
    misses = 0;
  let small = matchMedia('(max-width:760px)').matches;
  let width = small ? 640 : 1000;
  let height = Math.round((width * (baseHeight + paddingTop)) / baseWidth);
  const cacheRadius = () => {
    const originalRadius = small ? 6 : 12;
    if (paddingTop <= 0) return originalRadius;
    const budget = (small ? 32 : 100) * 1024 * 1024;
    const bytesPerBitmap = width * height * 4;
    // The odd desired window retains its center plus both neighbors. Reserve
    // one more bitmap for the previous visible frame during a distant seek.
    return Math.max(
      1,
      Math.min(originalRadius, Math.floor((budget / bytesPerBitmap - 2) / 2)),
    );
  };
  let radius = cacheRadius();
  const frameHeight = (frame: number) =>
    frame <= expandedThrough
      ? height
      : Math.round((width * baseHeight) / baseWidth);
  const frameOffset = (frame: number) =>
    frame <= expandedThrough ? 0 : Math.round((width * paddingTop) / baseWidth);
  const wanted = (distance: number) => {
    const frames = new Set([target, Math.floor(sample), Math.ceil(sample)]);
    for (let i = 1; i <= distance; i++)
      for (const f of [target + i * direction, target - i * direction])
        if (f >= 1 && f <= count) frames.add(f);
    return [...frames];
  };
  const reportFailure = (f: number) => {
    failures.set(f, (failures.get(f) ?? 0) + 1);
    retries.set(f, Date.now() + 900);
    if (f === target && (failures.get(f) ?? 0) >= 2) onUnavailable(true);
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      pumpDownloads();
      pumpDecode();
    }, 950);
  };
  const draw = () => {
    raf = 0;
    if (disposed || !active || !context) return;
    const key = bitmaps.has(target)
      ? target
      : [...bitmaps.keys()].sort(
          (a, b) => Math.abs(a - target) - Math.abs(b - target),
        )[0];
    const image = bitmaps.get(key);
    const signature = String(key);
    if (!image || signature === drawnSignature || Math.abs(key - target) > 4)
      return;
    // Expanded and original assets share one canvas. Keep the original image
    // region at the same offset even when adjacent frames have different sizes.
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    // Different mechanical poses must never overlap: paint one opaque frame
    // after clearing the canvas. Camera transforms remain continuous outside.
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, frameOffset(key));
    drawn = key;
    drawnSignature = signature;
    draws++;
    if (key === target) onUnavailable(false);
    onFrame(key, {
      decoded: bitmaps.size,
      encoded: blobs.size,
      misses,
      draws,
    });
  };
  const requestDraw = () => {
    if (!disposed && active && !raf) raf = requestAnimationFrame(draw);
  };
  const pumpDecode = () => {
    if (disposed || !active) return;
    const desired = wanted(radius);
    for (const [key, image] of bitmaps)
      if (!desired.includes(key) && key !== drawn) {
        image.close();
        bitmaps.delete(key);
      }
    for (const frame of desired) {
      if (decoding.size >= 2) break;
      const blob = blobs.get(frame);
      if (
        !blob ||
        bitmaps.has(frame) ||
        decoding.has(frame) ||
        (failures.get(frame) ?? 0) >= 2 ||
        (retries.get(frame) ?? 0) > Date.now()
      )
        continue;
      decoding.add(frame);
      void createImageBitmap(blob, {
        resizeWidth: width,
        resizeHeight: frameHeight(frame),
        resizeQuality: 'high',
      })
        .then((image) => {
          if (
            disposed ||
            !active ||
            image.width !== width ||
            image.height !== frameHeight(frame) ||
            Math.abs(frame - target) > radius
          ) {
            image.close();
            return;
          }
          bitmaps.set(frame, image);
          failures.delete(frame);
          retries.delete(frame);
          requestDraw();
        })
        .catch(() => {
          if (!disposed) {
            blobs.delete(frame);
            reportFailure(frame);
          }
        })
        .finally(() => {
          decoding.delete(frame);
          if (!disposed) pumpDecode();
        });
    }
  };
  const pumpDownloads = () => {
    if (disposed || !active) return;
    // Fetch the current neighborhood first, then retain the whole compressed
    // sequence in the background. The decoded window stays small throughout.
    const priority = wanted(Math.min(count, 32));
    const nearby = new Set(priority);
    for (let i = 1; i <= count; i++) if (!nearby.has(i)) priority.push(i);
    for (const frame of priority) {
      if (downloading.size >= 3) break;
      if (
        blobs.has(frame) ||
        downloading.has(frame) ||
        (failures.get(frame) ?? 0) >= 2 ||
        (retries.get(frame) ?? 0) > Date.now()
      )
        continue;
      const controller = new AbortController();
      downloading.set(frame, controller);
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      void fetch(`${prefix}frame-${String(frame).padStart(4, '0')}.webp`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error('Frame unavailable');
          const blob = await response.blob();
          if (disposed) return;
          blobs.set(frame, blob);
          pumpDecode();
        })
        .catch(() => {
          if (!disposed) reportFailure(frame);
        })
        .finally(() => {
          clearTimeout(timeout);
          downloading.delete(frame);
          if (!disposed) pumpDownloads();
        });
    }
  };
  return {
    resize(portrait: boolean) {
      if (disposed || small === portrait) return;
      small = portrait;
      width = small ? 640 : 1000;
      height = Math.round((width * (baseHeight + paddingTop)) / baseWidth);
      radius = cacheRadius();
      for (const image of bitmaps.values()) image.close();
      bitmaps.clear();
      drawn = -1;
      drawnSignature = '';
      pumpDecode();
      requestDraw();
    },
    seek(frame: number) {
      if (disposed) return;
      const previousSample = sample,
        previousTarget = target;
      sample = Math.max(1, Math.min(count, Number.isFinite(frame) ? frame : 1));
      target = Math.round(sample);
      const changed =
        !started ||
        target !== previousTarget ||
        Math.floor(sample) !== Math.floor(previousSample) ||
        Math.ceil(sample) !== Math.ceil(previousSample);
      started = true;
      if (sample !== previousSample) {
        direction = sample > previousSample ? 1 : -1;
      }
      if (target !== previousTarget && !bitmaps.has(target)) misses++;
      if ((failures.get(target) ?? 0) >= 2) onUnavailable(true);
      requestDraw();
      if (changed) {
        pumpDecode();
        pumpDownloads();
      }
    },
    setActive(value: boolean) {
      if (disposed || active === value) return;
      active = value;
      if (active) {
        pumpDecode();
        pumpDownloads();
        requestDraw();
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
        for (const image of bitmaps.values()) image.close();
        bitmaps.clear();
        drawn = -1;
        drawnSignature = '';
      }
    },
    retry() {
      if (disposed) return;
      for (const frame of failures.keys()) blobs.delete(frame);
      failures.clear();
      retries.clear();
      onUnavailable(false);
      pumpDownloads();
      pumpDecode();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      for (const controller of downloading.values()) controller.abort();
      for (const image of bitmaps.values()) image.close();
      blobs.clear();
      bitmaps.clear();
    },
  };
}
