'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cases } from '@/lib/content';
import { arcPose, clamp } from '@/lib/motion-math.mjs';
import { useLanguage } from './provider';
import { scrollPageTo } from './scroll';

export function KineticCases({
  onOpen,
}: {
  onOpen: (item: (typeof cases)[number]) => void;
}) {
  const { lang } = useLanguage();
  const stage = useRef<HTMLElement>(null);
  const choose = useRef<(index: number) => void>(() => {});
  const preventClick = useRef(false);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const node = stage.current;
    const section = node?.closest<HTMLElement>('.case-section');
    if (!node || !section) return;
    let disposed = false;
    let cleanup = () => {};
    const cards = Array.from(
      node.querySelectorAll<HTMLButtonElement>('.case-card'),
    );
    const nativeSelection = () => {
      if (section.dataset.kinetic) return;
      const center = node.scrollLeft + node.clientWidth / 2;
      let nearest = 0,
        distance = Infinity;
      cards.forEach((card, index) => {
        const delta = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        if (delta < distance) {
          nearest = index;
          distance = delta;
        }
      });
      setSelected(nearest);
    };
    node.addEventListener('scroll', nativeSelection, { passive: true });
    choose.current = (index) => {
      cards[index]?.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'instant',
      });
      setSelected(index);
    };
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        cleanup = () => media.revert();
        media.add(
          '(prefers-reduced-motion: no-preference) and (min-height: 621px)',
          () => {
            section.dataset.kinetic = 'true';
            const state = { focus: 0, entrance: 0 };
            let current = 0;
            setSelected(0);
            let width = cards[0].offsetWidth;
            const apply = () => {
              cards.forEach((card, index) => {
                const p = arcPose(index, state.focus, width);
                card.style.transform = `translate3d(calc(-50% + ${p.x * state.entrance}px), ${p.y + (1 - state.entrance) * 100}px, ${p.z}px) rotateY(${p.rotateY * state.entrance}deg) rotateZ(${p.rotateZ * state.entrance}deg)`;
                card.style.opacity = String(p.opacity);
                card.style.zIndex = String(p.zIndex);
                card.tabIndex = Math.abs(index - state.focus) < 0.55 ? 0 : -1;
                card.style.pointerEvents = p.opacity > 0.9 ? 'auto' : 'none';
              });
              const next = Math.round(clamp(state.focus, 0, cases.length - 1));
              if (next !== current) {
                current = next;
                setSelected(next);
              }
              node.dataset.focus = state.focus.toFixed(2);
            };
            const enter = gsap.to(state, {
              entrance: 1,
              ease: 'none',
              onUpdate: apply,
              scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                end: 'top 100px',
                scrub: 0.55,
              },
            });
            const motion = gsap.to(state, {
              focus: cases.length - 1,
              ease: 'none',
              onUpdate: apply,
              scrollTrigger: {
                trigger: section,
                start: 'top 88px',
                end: () =>
                  `+=${Math.max(1, section.offsetHeight - (section.querySelector<HTMLElement>('.case-kinetic-sticky')?.offsetHeight ?? innerHeight))}`,
                scrub: 0.5,
                invalidateOnRefresh: true,
              },
            });
            const trigger = motion.scrollTrigger!;
            const seek = (focus: number, immediate = false) => {
              const index = clamp(focus, 0, cases.length - 1);
              const top =
                trigger.start +
                ((trigger.end - trigger.start) * index) / (cases.length - 1);
              if (immediate)
                window.dispatchEvent(
                  new CustomEvent('flydeer:scroll-immediate', { detail: top }),
                );
              else scrollPageTo(top);
            };
            choose.current = (index) => seek(index);
            let drag: {
              x: number;
              y: number;
              focus: number;
              direction: 'pending' | 'horizontal' | 'vertical';
            } | null = null;
            const down = (event: PointerEvent) => {
              if (event.button !== 0) return;
              drag = {
                x: event.clientX,
                y: event.clientY,
                focus: state.focus,
                direction: 'pending',
              };
              preventClick.current = false;
            };
            const move = (event: PointerEvent) => {
              if (!drag) return;
              const dx = event.clientX - drag.x,
                dy = event.clientY - drag.y;
              if (
                drag.direction === 'pending' &&
                Math.max(Math.abs(dx), Math.abs(dy)) > 8
              )
                drag.direction =
                  Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
              if (drag.direction !== 'horizontal') return;
              preventClick.current = true;
              node.setPointerCapture(event.pointerId);
              motion.scrollTrigger?.getTween()?.progress(1);
              const focus = clamp(
                drag.focus - dx / (width * 0.65),
                0,
                cases.length - 1,
              );
              seek(focus, true);
              motion.scrollTrigger?.getTween()?.progress(1);
              motion.totalProgress(focus / (cases.length - 1));
              apply();
            };
            const up = (event: PointerEvent) => {
              if (drag?.direction === 'horizontal')
                seek(Math.round(state.focus));
              drag = null;
              if (node.hasPointerCapture(event.pointerId))
                node.releasePointerCapture(event.pointerId);
            };
            const cancel = () => {
              drag = null;
            };
            const resize = new ResizeObserver(() => {
              width = cards[0].offsetWidth;
              apply();
            });
            resize.observe(node);
            node.addEventListener('pointerdown', down);
            node.addEventListener('pointermove', move);
            node.addEventListener('pointerup', up);
            node.addEventListener('pointercancel', cancel);
            apply();
            return () => {
              enter.kill();
              motion.kill();
              resize.disconnect();
              node.removeEventListener('pointerdown', down);
              node.removeEventListener('pointermove', move);
              node.removeEventListener('pointerup', up);
              node.removeEventListener('pointercancel', cancel);
              cards.forEach((card) => {
                card.removeAttribute('style');
                card.removeAttribute('tabindex');
              });
              delete section.dataset.kinetic;
              choose.current = (index) => {
                cards[index]?.scrollIntoView({
                  block: 'nearest',
                  inline: 'center',
                  behavior: 'instant',
                });
                setSelected(index);
              };
            };
          },
        );
        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener('flydeer:layout', refresh);
        void document.fonts.ready.then(() => {
          if (!disposed) refresh();
        });
        refresh();
        cleanup = () => {
          window.removeEventListener('flydeer:layout', refresh);
          media.revert();
        };
      })
      .catch((error: unknown) =>
        console.warn(
          '[FRS POWER] Gallery motion unavailable; native gallery retained.',
          error,
        ),
      );
    return () => {
      disposed = true;
      node.removeEventListener('scroll', nativeSelection);
      cleanup();
    };
  }, []);
  return (
    <>
      <section
        ref={stage}
        className="kinetic-case-stage"
        aria-roledescription={lang === 'zh' ? '轮播' : 'carousel'}
        aria-label={
          lang === 'zh'
            ? '应用场景画廊，使用方向键或拖动切换'
            : 'Application gallery; use arrows or drag'
        }
      >
        {cases.map((item, index) => (
          <button
            key={item.id}
            className="case-card"
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                const next = clamp(
                  index + (event.key === 'ArrowRight' ? 1 : -1),
                  0,
                  cases.length - 1,
                );
                choose.current(next);
                stage.current
                  ?.querySelectorAll<HTMLButtonElement>('.case-card')
                  [next]?.focus({ preventScroll: true });
              }
            }}
            onDragStart={(event) => event.preventDefault()}
            onClick={(event) => {
              if (preventClick.current && event.detail !== 0) {
                preventClick.current = false;
                return;
              }
              onOpen(item);
            }}
            aria-label={`${item.title[lang]} — ${lang === 'zh' ? '查看场景' : 'View application'}`}
          >
            <img
              src={`/media/cases/${item.id}.webp`}
              alt={item.title[lang]}
              width="960"
              height="720"
              loading="lazy"
              draggable={false}
            />
            <span className="case-shade" />
            <span className="case-caption">
              <small>{item.kind}</small>
              <strong>{item.title[lang]}</strong>
            </span>
            <span className="case-open">
              <ArrowUpRight size={21} />
            </span>
          </button>
        ))}
      </section>
      <div className="gallery-toolbar wrap">
        <span className="gallery-hint">
          {lang === 'zh'
            ? '下滑穿行现场 · 拖动自由探索'
            : 'Scroll through the scenes · Drag to explore'}
        </span>
        <div
          className="gallery-dots"
          aria-label={lang === 'zh' ? '选择案例' : 'Choose application'}
        >
          {cases.map((item, i) => (
            <button
              key={item.id}
              onClick={() => choose.current(i)}
              aria-label={item.title[lang]}
              aria-pressed={selected === i}
            />
          ))}
        </div>
        <div className="gallery-arrows">
          <button
            className="icon-button"
            onClick={() => choose.current(selected - 1)}
            disabled={selected === 0}
            aria-label={lang === 'zh' ? '上一个案例' : 'Previous application'}
          >
            <ArrowLeft />
          </button>
          <button
            className="icon-button"
            onClick={() => choose.current(selected + 1)}
            disabled={selected === cases.length - 1}
            aria-label={lang === 'zh' ? '下一个案例' : 'Next application'}
          >
            <ArrowRight />
          </button>
        </div>
      </div>
    </>
  );
}
