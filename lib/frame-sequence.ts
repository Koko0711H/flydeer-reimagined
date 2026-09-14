// Encoded frames are cheap to retain. Decoding is a separate, bounded queue;
// normal scroll never cancels a decoder or repeats a network request.
export function createFrameSequence({
  canvas,
  count,
  prefix,
  framing,
  crops,
  imageSizes,
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
  crops?: number[][];
  imageSizes?: number[][];
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
  const decoding = new Map<number, { width: number; height: number }>();
  const failures = new Map<number, number>();
  const retries = new Map<number, number>();
  let preparedTarget: number | null = null;
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
  const cropped = crops?.length === count && imageSizes?.length === count;
  const cropStyleKeys = ['position', 'left', 'top', 'width', 'height'] as const;
  const originalStyle = cropped
    ? cropStyleKeys.map((key) => canvas.style[key])
    : [];
  const restoreCanvasStyle = () => {
    if (cropped)
      cropStyleKeys.forEach((key, index) => {
        canvas.style[key] = originalStyle[index];
      });
  };
  const positionCrop = (frame: number) => {
    if (!cropped || frame < 1) return;
    const [x, y, cropWidth, cropHeight] = crops![frame - 1];
    canvas.style.position = 'absolute';
    canvas.style.left = `${(x / 1000) * 100}%`;
    canvas.style.top = `${(y / 714) * 100}%`;
    canvas.style.width = `${(cropWidth / 1000) * 100}%`;
    canvas.style.height = `${(cropHeight / 714) * 100}%`;
  };
  const frameSize = (frame: number) => {
    if (!cropped)
      return {
        width,
        height:
          frame <= expandedThrough
            ? height
            : Math.round((width * baseHeight) / baseWidth),
      };
    const [nativeWidth, nativeHeight] = imageSizes![frame - 1];
    const scale = Math.min(
      1,
      (small ? 960 : 2000) / Math.max(nativeWidth, nativeHeight),
    );
    return {
      width: Math.max(1, Math.round(nativeWidth * scale)),
      height: Math.max(1, Math.round(nativeHeight * scale)),
    };
  };
  const bitmapBytes = (size: { width: number; height: number }) =>
    size.width * size.height * 4;
  const cropBudget = () => (small ? 24 : 100) * 1024 * 1024;
  const pendingBytes = () =>
    [...decoding.values()].reduce(
      (bytes, size) => bytes + bitmapBytes(size),
      0,
    );
  const wanted = (distance: number) => {
    const frames = new Set([target]);
    if (preparedTarget !== null) frames.add(preparedTarget);
    frames.add(Math.floor(sample));
    frames.add(Math.ceil(sample));
    for (let i = 1; i <= distance; i++) {
      for (const f of [target + i * direction, target - i * direction])
        if (f >= 1 && f <= count) frames.add(f);
      if (preparedTarget !== null)
        for (const f of [
          preparedTarget + i * direction,
          preparedTarget - i * direction,
        ])
          if (f >= 1 && f <= count) frames.add(f);
    }
    // Preparation shares the existing window; it never creates a second
    // decoded cache. Keep both centers ahead of their surrounding frames.
    return [...frames].slice(0, 2 * distance + 1);
  };
  const cacheRadius = () => {
    if (cropped) {
      // Tight frames have different aspect ratios. Reserve the retained pose
      // plus two decoder allocations before selecting a local cache window.
      for (let distance = 5; distance >= 1; distance--) {
        const frames = wanted(distance);
        const bytes = frames.map((frame) => bitmapBytes(frameSize(frame)));
        const retained = bitmaps.get(drawn);
        const retainedBytes =
          retained && !frames.includes(drawn) ? bitmapBytes(retained) : 0;
        const reservedDecoders =
          pendingBytes() + Math.max(0, 2 - decoding.size) * Math.max(...bytes);
        if (
          bytes.reduce((total, value) => total + value, 0) +
            retainedBytes +
            reservedDecoders <=
          cropBudget()
        )
          return distance;
      }
      return 1;
    }
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
  const frameOffset = (frame: number) =>
    cropped || frame <= expandedThrough
      ? 0
      : Math.round((width * paddingTop) / baseWidth);
  const reportFailure = (f: number) => {
    failures.set(f, (failures.get(f) ?? 0) + 1);
    retries.set(f, Date.now() + 900);
    if ((f === target || f === preparedTarget) && (failures.get(f) ?? 0) >= 2)
      onUnavailable(true);
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      pumpDownloads();
      pumpDecode();
    }, 950);
  };
  const draw = () => {
    raf = 0;
    if (disposed || !active || !started || !context) return;
    const key = bitmaps.has(target)
      ? target
      : preparedTarget !== null
        ? drawn
        : [...bitmaps.keys()]
            .filter((frame) =>
              // A decode may finish ahead of the requested pose. Showing it
              // would make the target snap backwards when its decode finishes.
              // Approach the target from the visible pose, allowing real reverse
              // seeks immediately, without letting completion order overshoot.
              drawn < 0
                ? (frame - target) * direction <= 0
                : frame >= Math.min(drawn, target) &&
                  frame <= Math.max(drawn, target),
            )
            .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
    const image = bitmaps.get(key);
    const signature = String(key);
    if (!image || signature === drawnSignature || Math.abs(key - target) > 4)
      return;
    // Expanded and original assets share one canvas. Keep the original image
    // region at the same offset even when adjacent frames have different sizes.
    const canvasWidth = cropped ? image.width : width,
      canvasHeight = cropped ? image.height : height;
    if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
    if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
    positionCrop(key);
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
    if (cropped) radius = cacheRadius();
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
      const size = frameSize(frame);
      if (
        cropped &&
        [...bitmaps.values()].reduce(
          (bytes, image) => bytes + bitmapBytes(image),
          pendingBytes() + bitmapBytes(size),
        ) > cropBudget()
      )
        continue;
      decoding.set(frame, size);
      void createImageBitmap(blob, {
        resizeWidth: size.width,
        resizeHeight: size.height,
        resizeQuality: 'high',
      })
        .then((image) => {
          if (
            disposed ||
            !active ||
            image.width !== frameSize(frame).width ||
            image.height !== frameSize(frame).height ||
            !wanted(radius).includes(frame)
          ) {
            image.close();
            return;
          }
          bitmaps.set(frame, image);
          failures.delete(frame);
          retries.delete(frame);
          // Only seek changes presentation. A prepared bitmap, including its
          // neighbors, can become ready without advancing the visible pose.
          if (started && (preparedTarget === null || frame === target))
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
    isReady(frame: number) {
      if (disposed || !Number.isFinite(frame)) return false;
      return bitmaps.has(Math.round(Math.max(1, Math.min(count, frame))));
    },
    prepare(frame: number) {
      if (disposed || !Number.isFinite(frame)) return;
      const next = Math.round(Math.max(1, Math.min(count, frame)));
      if (next === preparedTarget) return;
      preparedTarget = next;
      if ((failures.get(next) ?? 0) >= 2) onUnavailable(true);
      // The caller can seek a ready bitmap immediately. Avoid rearranging
      // the cache twice in the same tick before that seek consumes the target.
      if (bitmaps.has(next)) return;
      pumpDecode();
      pumpDownloads();
    },
    resize(portrait: boolean) {
      if (disposed || small === portrait) return;
      small = portrait;
      width = small ? 640 : 1000;
      height = Math.round((width * (baseHeight + paddingTop)) / baseWidth);
      radius = cacheRadius();
      // Keep the currently painted crop in the same logical position while
      // its new-resolution bitmap decodes; do not stretch it to the actor.
      restoreCanvasStyle();
      positionCrop(drawn);
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
      if (preparedTarget === target) preparedTarget = null;
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
      restoreCanvasStyle();
    },
  };
}
