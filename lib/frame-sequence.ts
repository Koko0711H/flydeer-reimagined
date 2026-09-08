// Encoded frames are cheap to retain. Decoding is a separate, bounded queue;
// normal scroll never cancels a decoder or repeats a network request.
export function createFrameSequence({
  canvas,
  count,
  prefix,
  onFrame,
  onUnavailable,
}: {
  canvas: HTMLCanvasElement;
  count: number;
  prefix: string;
  onFrame: (
    frame: number,
    stats: { decoded: number; encoded: number; misses: number; draws: number },
  ) => void;
  onUnavailable: (failed: boolean) => void;
}) {
  const context = canvas.getContext('2d');
  const blobs = new Map<number, Blob>();
  const bitmaps = new Map<number, ImageBitmap>();
  const downloading = new Map<number, AbortController>();
  const decoding = new Set<number>();
  const failures = new Map<number, number>();
  const retries = new Map<number, number>();
  let target = 1,
    previous = 1,
    direction = 1,
    drawn = -1,
    raf = 0,
    timer = 0,
    disposed = false,
    active = true,
    draws = 0,
    misses = 0;
  let small = matchMedia('(max-width:760px)').matches;
  let radius = small ? 6 : 12;
  let width = small ? 640 : 1000;
  let height = Math.round((width * 5) / 7);
  const wanted = (distance: number) => {
    const frames = [target];
    for (let i = 1; i <= distance; i++)
      for (const f of [target + i * direction, target - i * direction])
        if (f >= 1 && f <= count) frames.push(f);
    return frames;
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
    if (!image || key === drawn || Math.abs(key - target) > 4) return;
    if (canvas.width !== image.width) canvas.width = image.width;
    if (canvas.height !== image.height) canvas.height = image.height;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    drawn = key;
    draws++;
    if (key === target) onUnavailable(false);
    onFrame(key, { decoded: bitmaps.size, encoded: blobs.size, misses, draws });
  };
  const requestDraw = () => {
    if (!raf) raf = requestAnimationFrame(draw);
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
        resizeHeight: height,
        resizeQuality: 'high',
      })
        .then((image) => {
          if (
            disposed ||
            !active ||
            image.width !== width ||
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
      if (small === portrait) return;
      small = portrait;
      radius = small ? 6 : 12;
      width = small ? 640 : 1000;
      height = Math.round((width * 5) / 7);
      for (const image of bitmaps.values()) image.close();
      bitmaps.clear();
      drawn = -1;
      pumpDecode();
      requestDraw();
    },
    seek(frame: number) {
      target = Math.max(1, Math.min(count, frame));
      if (target !== previous) {
        direction = target > previous ? 1 : -1;
        if (!bitmaps.has(target)) misses++;
        previous = target;
      }
      if ((failures.get(target) ?? 0) >= 2) onUnavailable(true);
      requestDraw();
      pumpDecode();
      pumpDownloads();
    },
    setActive(value: boolean) {
      if (active === value) return;
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
      }
    },
    retry() {
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
