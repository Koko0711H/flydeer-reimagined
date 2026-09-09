'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ramp,
  storySample,
  storyPose,
  storyPosition,
  STORY_IDS,
  trackAt,
} from '@/lib/story-math.mjs';
import { createFrameSequence } from '@/lib/frame-sequence';

export function StoryStage({
  application,
  industry,
}: {
  application: string;
  industry: string;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const retry = useRef<() => void>(() => {});
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const world = stage.current;
    const owner = world?.closest<HTMLElement>('.power-story');
    if (!owner || !world) return;
    const actor = world.querySelector<HTMLElement>('.power-actor')!;
    const canvas = world.querySelector('canvas')!;
    const context = canvas.getContext('2d');
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
    let viewportWidth = innerWidth,
      viewportHeight = world.clientHeight;
    const seek = () => {
      raf = 0;
      if (disposed || modeChanging || !offsets.length) return;
      value = storyPosition(offsets, scrollY);
      if (reduced) return;
      const pose = storyPose(value, innerWidth <= 760);
      const next = storySample(value, frameCount);
      target = next;
      const objectViewport =
        viewportWidth <= 760 ? Math.min(viewportWidth, 420) : viewportWidth;
      const width = (objectViewport * pose.width) / 100;
      const x = (viewportWidth * pose.x) / 100 - width / 2;
      const y = (viewportHeight * pose.y) / 100 - width / 2.8;
      actor.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${(width / viewportWidth).toFixed(5)})`;
      actor.style.opacity = String(pose.opacity);
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
        // Keep readable copy in its viewport lane while the sticky section
        // reaches its boundary; its opacity handles the outgoing transition.
        const hold = Math.max(
          0,
          Math.min(shotHeights[i], scrollY - offsets[i + 1] + shotHeights[i]),
        );
        shots[i].style.setProperty('--copy-hold', `${hold.toFixed(2)}px`);
        const opacity =
          local >= 0
            ? 1 - ramp(local, i === 6 ? 0.48 : 0.56, i === 6 ? 0.72 : 0.9)
            : ramp(local, i === 7 ? -0.1 : -0.28, 0);
        shots[i].style.setProperty('--copy-opacity', String(opacity));
        shots[i].style.pointerEvents = opacity < 0.12 ? 'none' : '';
      }
      player?.seek(target);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(seek);
    };
    const measure = () => {
      viewportWidth = innerWidth;
      viewportHeight = world.clientHeight;
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
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', queueMeasure);
    window.addEventListener('flydeer:layout', queueMeasure);
    compact.addEventListener('change', changeMode);
    void document.fonts.ready.then(() => {
      if (!disposed) queueMeasure();
    });
    // This URL is added atomically with the complete sequence.
    const manifestController = new AbortController();
    let manifestLoading = false;
    const loadManifest = () => {
      if (disposed || manifestLoading) return;
      manifestLoading = true;
      void fetch('/media/story/manifest.json', {
        signal: manifestController.signal,
      })
        .then((r) => {
          if (!r.ok) throw new Error('Sequence unavailable');
          return r.json();
        })
        .then((manifest) => {
          if (disposed) return;
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
          frameCount = manifest.frameCount;
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
            prefix:
              manifest.version >= 3 ? '/media/story/motion/' : '/media/story/',
            onFrame: (frame, stats) => {
              world.dataset.ready = 'true';
              world.dataset.frame = String(frame);
              world.dataset.decoded = String(stats.decoded);
              world.dataset.encoded = String(stats.encoded);
              world.dataset.misses = String(stats.misses);
              world.dataset.draws = String(stats.draws);
            },
            onUnavailable: setUnavailable,
          });
          owner.dataset.sequence = 'ready';
          player.setActive(inView && !reduced);
          schedule();
        })
        .catch(() => {
          if (!disposed) setUnavailable(true);
        })
        .finally(() => {
          manifestLoading = false;
        });
    };
    retry.current = () => {
      setUnavailable(false);
      if (player) player.retry();
      else loadManifest();
    };
    loadManifest();
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
      manifestController.abort();
      visibility.disconnect();
      resize.disconnect();
      delete owner.dataset.enhanced;
      delete owner.dataset.reduced;
      delete owner.dataset.sequence;
      player?.dispose();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', queueMeasure);
      window.removeEventListener('flydeer:layout', queueMeasure);
      compact.removeEventListener('change', changeMode);
    };
  }, []);
  return (
    <>
      <div className="power-stage" ref={stage} aria-hidden="true">
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
            <img src="/media/story/poster.webp" alt="" />
            <canvas width="1400" height="1000" />
          </div>
        </div>
      </div>
      {unavailable && (
        <output className="power-motion-recovery">
          <span>动画加载不完整 / Animation unavailable</span>
          <button onClick={() => retry.current()}>重试 / Retry</button>
        </output>
      )}
    </>
  );
}
