'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ramp,
  storySample,
  storyPose,
  fitStoryPose,
  storyDesktopBounds,
  createStoryCameraTrack,
  fitStoryCameraPose,
  advanceStoryCamera,
  storyPosition,
  STORY_IDS,
  trackAt,
} from '@/lib/story-math.mjs';
import { createFrameSequence } from '@/lib/frame-sequence';
import {
  createStorySequenceLoader,
  storyAssetBase,
  type StoryProductId,
} from '@/lib/story-variants';
import { useLanguage } from './provider';

export function StoryStage({
  application,
  industry,
  product,
}: {
  application: string;
  industry: string;
  product: StoryProductId;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const retry = useRef<() => void>(() => {});
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const initialProduct = useRef(product);
  const selectSequence = useRef<(product: StoryProductId) => void>(() => {});
  const { lang } = useLanguage();
  useEffect(() => {
    const world = stage.current;
    const owner = world?.closest<HTMLElement>('.power-story');
    if (!owner || !world) return;
    const actor = world.querySelector<HTMLElement>('.power-actor')!;
    const header = document.querySelector<HTMLElement>('.site-header');
    const canvas = world.querySelector('canvas')!;
    const context = canvas.getContext('2d');
    if (!context) {
      setLoading(false);
      return;
    }
    const factory = world.querySelector<HTMLElement>('.power-factory-portal')!;
    const destination = world.querySelector<HTMLElement>('.power-site-portal')!;
    const road = world.querySelector<HTMLElement>('.power-road')!;
    const delivery = world.querySelector<HTMLElement>('.power-delivery-photo')!;
    const chapters = Array.from(
      owner.querySelectorAll<HTMLElement>('[data-chapter]'),
    );
    const shots = chapters.map((node) =>
      node.querySelector<HTMLElement>('.power-shot')!,
    );
    const compact = matchMedia(
      '(prefers-reduced-motion: reduce), (max-height: 620px), (max-width: 760px) and (max-height: 740px)',
    );
    let disposed = false,
      raf = 0,
      layoutRaf = 0,
      modeRaf = 0,
      modeChanging = false;
    let offsets: number[] = [],
      shotHeights: number[] = [],
      value = 0,
      active = -1,
      target = 1;
    let preserve = 0,
      inView = true;
    let reduced = compact.matches;
    if (context) owner.dataset.enhanced = 'true';
    owner.dataset.reduced = String(reduced);
    let player: ReturnType<typeof createFrameSequence> | null = null;
    let frameCount = 144;
    let containedFrames = true;
    let subjectBounds: number[][] = [];
    let cameraTrack: ReturnType<typeof createStoryCameraTrack> = null;
    let displayedFrame = 1;
    let cameraPosition = { sample: 1, value: 0 };
    let presentation = { sample: 1, value: 0, recovering: false };
    let frameUnavailable = false;
    let viewportWidth = innerWidth,
      viewportHeight = world.clientHeight,
      headerBottom = header?.getBoundingClientRect().bottom ?? 80;
    const placeActor = () => {
      const presentedValue = cameraTrack ? presentation.value : value;
      const presentedTarget = cameraTrack ? presentation.sample : target;
      const pose = storyPose(presentedValue, viewportWidth <= 760);
      // During a distant seek, keep the old bitmap fitted to its own camera
      // until the new pose is ready. Nearby frames share the continuous track.
      cameraPosition = advanceStoryCamera(
        presentedTarget,
        presentedValue,
        displayedFrame,
        cameraPosition,
      );
      const fitted =
        cameraTrack && viewportWidth > 760
          ? fitStoryCameraPose(
              pose,
              viewportWidth,
              viewportHeight,
              headerBottom,
              cameraPosition.value,
              cameraPosition.sample,
              cameraTrack,
              displayedFrame,
            )
          : fitStoryPose(
              pose,
              viewportWidth,
              viewportHeight,
              headerBottom,
              24,
              containedFrames && viewportWidth > 760
                ? storyDesktopBounds(
                    value,
                    target,
                    subjectBounds,
                    displayedFrame,
                  )
                : undefined,
            );
      // Version 4 has an extended upper image region. Keep its original
      // coordinate system when previewing an older asset package.
      const width = containedFrames
        ? fitted.width
        : ((viewportWidth <= 760
            ? Math.min(viewportWidth, 420)
            : viewportWidth) *
            pose.width) /
          100;
      const x = containedFrames
        ? fitted.x
        : (viewportWidth * pose.x) / 100 - width / 2;
      const y = containedFrames
        ? fitted.y
        : (viewportHeight * pose.y) / 100 - width / 2.8;
      actor.style.transform = `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0) scale(${(width / viewportWidth).toFixed(7)})`;
      actor.style.opacity = String(pose.opacity);
    };
    const seek = () => {
      raf = 0;
      if (disposed || modeChanging || !offsets.length) return;
      value = storyPosition(offsets, scrollY);
      if (reduced) return;
      target = storySample(value, frameCount);
      if (player && cameraTrack && inView && !frameUnavailable) {
        // Scroll owns the requested pose. The player paints the newest
        // available frame on its way there, without replaying a backlog after
        // a brief decoder stall or limiting later scrolling to a fixed speed.
        presentation = { sample: target, value, recovering: false };
        player.seek(target);
        world.dataset.presentation = presentation.sample.toFixed(3);
        world.dataset.recovering = 'false';
      }
      placeActor();
      const factoryIn = ramp(value, 1.65, 2.02);
      const factoryOut = ramp(value, 2.65, 3.02);
      factory.style.opacity = String(factoryIn * (1 - factoryOut));
      factory.style.clipPath = `inset(${(1 - factoryIn) * 16}% ${(1 - factoryIn) * 54}% ${(1 - factoryIn) * 16}% 0)`;
      factory.style.transform = `scale(${1.12 - factoryIn * 0.12 + factoryOut * 0.1})`;
      const roadTop = trackAt(
        [
          [0, 110],
          [3.6, 110],
          [4, 87],
          [4.5, 68],
          [5, innerWidth <= 760 ? 47 : 54],
          [5.55, innerWidth <= 760 ? 47 : 54],
          [6.2, 0],
          [6.72, 0],
          [7, 110],
        ],
        value,
      );
      road.style.transform = `translateY(${roadTop}svh)`;
      const arrive = ramp(value, 5.75, 6.3);
      const leave = ramp(value, 6.7, 7);
      const portrait = viewportWidth <= 760;
      destination.style.opacity = String(arrive);
      destination.style.clipPath = `inset(${(1 - arrive) * 5 + leave * (portrait ? 10 : 16)}% ${leave * 6}% ${leave * (portrait ? 68 : 51)}% ${(1 - arrive) * 28 + leave * (portrait ? 52 : 62)}% round ${leave * 16}px)`;
      destination.style.transform = `scale(${1.08 - arrive * 0.08})`;
      delivery.style.opacity = String(ramp(value, 6.84, 7.2));
      const chapter = Math.min(7, Math.floor(value));
      if (active !== chapter) {
        active = chapter;
        owner.dataset.activeChapter = STORY_IDS[chapter];
        window.dispatchEvent(
          new CustomEvent('frs:chapter', { detail: STORY_IDS[chapter] }),
        );
      }
      world.dataset.position = value.toFixed(3);
      for (let i = 0; i < shots.length; i++) {
        const local = value - i;
        if (i === 3 && !portrait)
          shots[i].style.setProperty(
            '--detail-opacity',
            String(1 - ramp(local, 0.12, 0.24)),
          );
        // Keep readable copy in its viewport lane while the sticky section
        // reaches its boundary; its opacity handles the outgoing transition.
        const hold = Math.max(
          0,
          Math.min(shotHeights[i], scrollY - offsets[i + 1] + shotHeights[i]),
        );
        shots[i].style.setProperty('--copy-hold', `${hold.toFixed(2)}px`);
        const opacity =
          local >= 0
            ? 1 -
              ramp(
                local,
                !portrait && i === 3 ? 0.35 : i === 6 ? 0.48 : 0.56,
                !portrait && i === 3 ? 0.48 : i === 6 ? 0.72 : 0.9,
              )
            : ramp(local, i === 7 ? -0.1 : -0.28, 0);
        shots[i].style.setProperty('--copy-opacity', String(opacity));
        shots[i].style.pointerEvents = opacity < 0.12 ? 'none' : '';
      }
      if (!cameraTrack) player?.seek(target);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(seek);
    };
    const measure = () => {
      viewportWidth = world.clientWidth || innerWidth;
      viewportHeight = world.clientHeight;
      headerBottom = header?.getBoundingClientRect().bottom ?? 80;
      actor.style.setProperty('--actor-base-width', `${viewportWidth}px`);
      owner.style.setProperty(
        '--story-header',
        `${Math.max(0, headerBottom)}px`,
      );
      player?.resize(viewportWidth <= 760);
      offsets = chapters.map(
        (node) => node.offsetTop + owner.getBoundingClientRect().top + scrollY,
      );
      offsets.push(
        owner.offsetHeight + owner.getBoundingClientRect().top + scrollY,
      );
      shotHeights = shots.map((shot) => shot.offsetHeight);
      schedule();
    };
    const queueMeasure = () => {
      if (modeChanging) return;
      cancelAnimationFrame(layoutRaf);
      layoutRaf = requestAnimationFrame(measure);
    };
    const changeMode = () => {
      preserve = value;
      modeChanging = true;
      reduced = compact.matches;
      owner.dataset.reduced = String(reduced);
      player?.setActive(!reduced && inView);
      shots.forEach((shot) => {
        shot.style.removeProperty('--copy-opacity');
        shot.style.removeProperty('--copy-hold');
        shot.style.pointerEvents = '';
      });
      const restore = inView && scrollY > 1;
      cancelAnimationFrame(layoutRaf);
      cancelAnimationFrame(modeRaf);
      modeRaf = requestAnimationFrame(() => {
        modeRaf = requestAnimationFrame(() => {
          if (disposed) return;
          measure();
          if (restore) {
            const index = Math.min(7, Math.floor(preserve));
            const top =
              offsets[index] +
              (reduced
                ? 0
                : (preserve - index) * (offsets[index + 1] - offsets[index]));
            const event = new CustomEvent('flydeer:scroll-immediate', {
              detail: top,
              cancelable: true,
            });
            if (window.dispatchEvent(event))
              window.scrollTo({ top, behavior: 'instant' });
          }
          modeChanging = false;
          window.dispatchEvent(new Event('flydeer:layout'));
          schedule();
        });
      });
    };
    const visibility = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        player?.setActive(inView && !reduced);
        if (inView) schedule();
      },
      { rootMargin: '500px' },
    );
    visibility.observe(owner);
    const resize = new ResizeObserver(queueMeasure);
    chapters.forEach((chapter) => resize.observe(chapter));
    if (header) resize.observe(header);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', queueMeasure);
    window.addEventListener('flydeer:layout', queueMeasure);
    compact.addEventListener('change', changeMode);
    void document.fonts.ready.then(() => {
      if (!disposed) queueMeasure();
    });
    const loader = createStorySequenceLoader({
      onStart: (selected) => {
        player?.dispose();
        player = null;
        cameraTrack = null;
        subjectBounds = [];
        frameUnavailable = false;
        containedFrames = true;
        world.dataset.ready = 'false';
        world.dataset.product = selected;
        owner.dataset.sequence = 'loading';
        setUnavailable(false);
        setLoading(true);
        context?.clearRect(0, 0, canvas.width, canvas.height);
        actor.style.setProperty('--sequence-padding', '0');
        schedule();
      },
      onManifest: (manifest, selected) => {
        if (
          !manifest ||
          typeof manifest !== 'object' ||
          !('frameCount' in manifest) ||
          typeof manifest.frameCount !== 'number' ||
          !Number.isInteger(manifest.frameCount) ||
          manifest.frameCount < 1 ||
          manifest.frameCount > 1000 ||
          !('version' in manifest) ||
          typeof manifest.version !== 'number'
        )
          throw new Error('Invalid sequence manifest');
        if ('productId' in manifest && manifest.productId !== selected)
          throw new Error('Sequence does not match the selected product');
        frameCount = manifest.frameCount;
        containedFrames = manifest.version >= 5;
        if (
          containedFrames &&
          (!('width' in manifest) ||
            manifest.width !== 1000 ||
            !('height' in manifest) ||
            manifest.height !== 714 ||
            ('framing' in manifest && manifest.framing !== undefined))
        )
          throw new Error('Invalid contained sequence dimensions');
        if ('desktopSubjectBounds' in manifest) {
          const boxes = manifest.desktopSubjectBounds;
          if (
            !Array.isArray(boxes) ||
            boxes.length !== frameCount ||
            !boxes.every(
              (box: unknown) =>
                Array.isArray(box) &&
                box.length === 4 &&
                box.every(
                  (n: unknown) => typeof n === 'number' && Number.isFinite(n),
                ) &&
                box[0] < box[2] &&
                box[1] < box[3],
            )
          )
            throw new Error('Invalid desktop subject bounds');
          subjectBounds = boxes;
        }
        if ('desktopCameraFrames' in manifest) {
          const cameras = manifest.desktopCameraFrames;
          if (
            !Array.isArray(cameras) ||
            cameras.length !== frameCount ||
            !subjectBounds.length ||
            !cameras.every(
              (camera: unknown) =>
                Array.isArray(camera) &&
                camera.length === 3 &&
                camera[0] > 0 &&
                camera.every(
                  (n: unknown) => typeof n === 'number' && Number.isFinite(n),
                ),
            )
          )
            throw new Error('Invalid sequence camera track');
          const referenceSpans =
            'referenceCameraSpans' in manifest
              ? manifest.referenceCameraSpans
              : undefined;
          if (
            referenceSpans !== undefined &&
            (!Array.isArray(referenceSpans) ||
              referenceSpans.length !== frameCount ||
              !referenceSpans.every(
                (n: unknown) =>
                  typeof n === 'number' && Number.isFinite(n) && n > 0,
              ))
          )
            throw new Error('Invalid reference camera spans');
          cameraTrack = createStoryCameraTrack(
            subjectBounds,
            cameras,
            referenceSpans,
            selected === 'container',
          );
        }
        const crops = 'crops' in manifest ? manifest.crops : undefined;
        const imageSizes =
          'imageSizes' in manifest ? manifest.imageSizes : undefined;
        if (crops !== undefined || imageSizes !== undefined) {
          if (
            !Array.isArray(crops) ||
            crops.length !== frameCount ||
            !Array.isArray(imageSizes) ||
            imageSizes.length !== frameCount ||
            !crops.every(
              (box: unknown) =>
                Array.isArray(box) &&
                box.length === 4 &&
                box.every(
                  (n: unknown) => typeof n === 'number' && Number.isFinite(n),
                ) &&
                box[2] > 0 &&
                box[3] > 0,
            ) ||
            !imageSizes.every(
              (size: unknown) =>
                Array.isArray(size) &&
                size.length === 2 &&
                size.every(
                  (n: unknown) =>
                    typeof n === 'number' &&
                    Number.isInteger(n) &&
                    n > 0 &&
                    n <= 4096,
                ),
            )
          )
            throw new Error('Invalid high resolution sequence geometry');
        }
        owner.dataset.sequenceLayout = containedFrames ? 'contained' : 'legacy';
        const framing =
          'framing' in manifest &&
          manifest.framing &&
          typeof manifest.framing === 'object' &&
          'baseWidth' in manifest.framing &&
          'baseHeight' in manifest.framing &&
          'paddingTop' in manifest.framing &&
          'expandedThrough' in manifest.framing &&
          manifest.framing.baseWidth === 1000 &&
          manifest.framing.baseHeight === 714 &&
          manifest.framing.paddingTop === 2200 &&
          manifest.framing.expandedThrough === 330
            ? {
                baseWidth: 1000,
                baseHeight: 714,
                paddingTop: 2200,
                expandedThrough: 330,
              }
            : undefined;
        actor.style.setProperty(
          '--sequence-padding',
          String(framing ? framing.paddingTop / framing.baseWidth : 0),
        );
        player = createFrameSequence({
          canvas,
          count: frameCount,
          framing,
          crops,
          imageSizes,
          prefix:
            manifest.version >= 3
              ? `${storyAssetBase(selected)}/motion/`
              : `${storyAssetBase(selected)}/`,
          onFrame: (frame, stats) => {
            displayedFrame = frame;
            placeActor();
            if (world.dataset.ready !== 'true') setLoading(false);
            world.dataset.ready = 'true';
            world.dataset.product = selected;
            world.dataset.frame = String(frame);
            world.dataset.decoded = String(stats.decoded);
            world.dataset.encoded = String(stats.encoded);
            world.dataset.misses = String(stats.misses);
            world.dataset.draws = String(stats.draws);
          },
          onUnavailable: (failed) => {
            const recovering = frameUnavailable && !failed;
            frameUnavailable = failed;
            setUnavailable(failed);
            if (recovering) schedule();
          },
        });
        owner.dataset.sequence = 'ready';
        target = storySample(value, frameCount);
        displayedFrame = Math.round(target);
        cameraPosition = { sample: target, value };
        presentation = { sample: target, value, recovering: false };
        player.setActive(inView && !reduced);
        if (reduced) setLoading(false);
        schedule();
      },
      onError: () => {
        setUnavailable(true);
        setLoading(false);
      },
    });
    selectSequence.current = loader.select;
    retry.current = () => {
      frameUnavailable = false;
      setUnavailable(false);
      if (player) player.retry();
      else loader.retry();
      schedule();
    };
    loader.select(initialProduct.current);
    measure();
    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navigation?.type === 'navigate' && location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const targetNode = document.getElementById(id);
      if (targetNode && owner.contains(targetNode)) {
        modeRaf = requestAnimationFrame(() => {
          modeRaf = requestAnimationFrame(() => {
            if (disposed) return;
            measure();
            const targetChapter =
              targetNode.closest<HTMLElement>('[data-chapter]') ?? targetNode;
            const top = targetChapter.getBoundingClientRect().top + scrollY;
            const event = new CustomEvent('flydeer:scroll-immediate', {
              detail: top,
              cancelable: true,
            });
            if (window.dispatchEvent(event))
              window.scrollTo({ top, behavior: 'instant' });
          });
        });
      }
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(layoutRaf);
      cancelAnimationFrame(modeRaf);
      retry.current = () => {};
      loader.dispose();
      selectSequence.current = () => {};
      visibility.disconnect();
      resize.disconnect();
      delete owner.dataset.enhanced;
      delete owner.dataset.reduced;
      delete owner.dataset.sequence;
      delete owner.dataset.sequenceLayout;
      owner.style.removeProperty('--story-header');
      player?.dispose();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', queueMeasure);
      window.removeEventListener('flydeer:layout', queueMeasure);
      compact.removeEventListener('change', changeMode);
    };
  }, []);
  useEffect(() => {
    selectSequence.current(product);
  }, [product]);
  return (
    <>
      <div
        id="selected-product-model"
        className="power-stage"
        ref={stage}
        aria-hidden="true"
      >
        <div className="power-stage-world">
          <div className="power-factory-portal">
            <img src="/media/company/factory-assembly.webp" alt="" />
          </div>
          <div className="power-road">
            <img src={`/media/cases/${industry}.webp`} alt="" />
          </div>
          <div className="power-site-portal">
            <img src={`/media/cases/${application}.webp`} alt="" />
            <img
              className="power-delivery-photo"
              src="/media/company/delivery/delivery-site-05.webp"
              alt=""
            />
          </div>
          <div className="power-actor">
            <img src={`${storyAssetBase(product)}/poster.webp`} alt="" />
            <canvas width="1400" height="1000" />
          </div>
        </div>
      </div>
      {loading && !unavailable && (
        <output className="power-model-loading">
          {lang === 'zh' ? '正在准备机组…' : 'Preparing your generator…'}
        </output>
      )}
      {unavailable && (
        <output className="power-motion-recovery">
          <span>
            {lang === 'zh' ? '动画加载不完整' : 'Animation unavailable'}
          </span>
          <button onClick={() => retry.current()}>
            {lang === 'zh' ? '重试' : 'Retry'}
          </button>
        </output>
      )}
    </>
  );
}
