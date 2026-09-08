'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { cases } from '@/lib/content';
import { useLanguage } from './provider';

export function CaseGallery({ grid = false }: { grid?: boolean }) {
  const { lang } = useLanguage();
  const [reduced, setReduced] = useState(false);
  const [emblaRef, api] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    loop: false,
    startIndex: 3,
    duration: reduced ? 0 : 34,
  });
  const viewport = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(3);
  const [active, setActive] = useState<(typeof cases)[number] | null>(null);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('flydeer:overlay', { detail: !!active }),
    );
    return () => {
      if (active)
        window.dispatchEvent(
          new CustomEvent('flydeer:overlay', { detail: false }),
        );
    };
  }, [active]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  const [filter, setFilter] = useState('all');
  const [canPrev, setCanPrev] = useState(true);
  const [canNext, setCanNext] = useState(true);
  const visible = grid
    ? cases.filter((c) => filter === 'all' || c.category === filter)
    : cases;
  const tween = useCallback(() => {
    if (!api || grid) return;
    const progress = api.scrollProgress();
    const motion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wide = matchMedia('(min-width: 760px)').matches;
    const current = progress * (cases.length - 1);
    api.slideNodes().forEach((slide, i) => {
      const card = slide.querySelector<HTMLElement>('.case-card');
      const distance = Math.max(-3, Math.min(3, i - current));
      if (card) {
        card.style.transform =
          wide && !motion
            ? `translateY(${Math.min(96, Math.abs(distance) ** 1.65 * 27)}px) rotateY(${-distance * 13}deg) rotateZ(${distance * 3}deg) scale(${1 - Math.min(Math.abs(distance) * 0.07, 0.2)})`
            : 'none';
      }
      slide.style.zIndex = `${10 - Math.round(Math.abs(distance))}`;
    });
  }, [api, grid]);
  useEffect(() => {
    if (!api || grid) return;
    const update = () => {
      setSelected(api.selectedScrollSnap());
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
      tween();
    };
    api.on('scroll', tween).on('reInit', update).on('select', update);
    update();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    reduce.addEventListener('change', tween);
    return () => {
      api.off('scroll', tween).off('reInit', update).off('select', update);
      reduce.removeEventListener('change', tween);
    };
  }, [api, tween, grid]);
  return (
    <>
      <section
        className={`case-section ${grid ? 'case-section-grid' : ''}`}
        id="cases"
        aria-label={lang === 'zh' ? '项目应用场景' : 'Project applications'}
      >
        <div className="section-heading wrap" data-reveal>
          <div>
            <p className="eyebrow">POWER IN THE REAL WORLD.</p>
            <h2>
              {lang === 'zh' ? (
                <>
                  每个现场。
                  <br />
                  <span>都有答案。</span>
                </>
              ) : (
                <>
                  Every setting.
                  <br />
                  <span>A power solution.</span>
                </>
              )}
            </h2>
          </div>
          <p>
            {lang === 'zh'
              ? '从城市枢纽，到远方的生产现场。探索不同场景中的动力需求。'
              : 'From urban hubs to distant production sites. Explore power requirements across different settings.'}
          </p>
        </div>
        {grid ? (
          <div
            className="filter-bar wrap"
            aria-label={lang === 'zh' ? '按场景筛选' : 'Filter by application'}
          >
            {[
              ['all', '全部场景', 'All'],
              ['industry', '工业制造', 'Industrial'],
              ['infrastructure', '基础设施', 'Infrastructure'],
              ['public', '公共服务', 'Public'],
              ['commercial', '商业旅居', 'Commercial'],
            ].map(([id, zh, en]) => (
              <button
                key={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {lang === 'zh' ? zh : en}
              </button>
            ))}
          </div>
        ) : null}
        <div ref={viewport} className={grid ? 'case-grid wrap' : 'case-stage'}>
          <div
            ref={grid ? undefined : emblaRef}
            className={grid ? '' : 'case-viewport'}
          >
            <div className={grid ? 'case-grid-inner' : 'case-track'}>
              {visible.map((c) => (
                <div key={c.id} className="case-slide">
                  <button
                    className="case-card"
                    onClick={() => setActive(c)}
                    aria-label={`${c.title[lang]} — ${lang === 'zh' ? '查看场景' : 'View application'}`}
                  >
                    <img
                      src={`/media/cases/${c.id}.webp`}
                      alt={c.title[lang]}
                      width="960"
                      height="720"
                      loading="lazy"
                    />
                    <span className="case-shade" />
                    <span className="case-caption">
                      <small>{c.kind}</small>
                      <strong>{c.title[lang]}</strong>
                    </span>
                    <span className="case-open">
                      <ArrowUpRight size={21} />
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {!grid ? (
          <div className="gallery-toolbar wrap">
            <span className="gallery-hint">
              {lang === 'zh'
                ? '拖动卡片，探索不同现场'
                : 'Drag to explore applications'}
            </span>
            <div
              className="gallery-dots"
              aria-label={lang === 'zh' ? '选择案例' : 'Choose application'}
            >
              {cases.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={c.title[lang]}
                  aria-pressed={selected === i}
                />
              ))}
            </div>
            <div className="gallery-arrows">
              <button
                className="icon-button"
                onClick={() => api?.scrollPrev()}
                disabled={!canPrev}
                aria-label={
                  lang === 'zh' ? '上一个案例' : 'Previous application'
                }
              >
                <ArrowLeft />
              </button>
              <button
                className="icon-button"
                onClick={() => api?.scrollNext()}
                disabled={!canNext}
                aria-label={lang === 'zh' ? '下一个案例' : 'Next application'}
              >
                <ArrowRight />
              </button>
            </div>
          </div>
        ) : null}
        {!grid ? (
          <div className="wrap case-more">
            <a className="text-link" href={`/cases?lang=${lang}`}>
              {lang === 'zh' ? '查看全部应用场景' : 'Explore all applications'}
              <ArrowUpRight size={20} />
            </a>
          </div>
        ) : null}
      </section>
      <Dialog
        open={!!active}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent
          className="case-dialog"
          showCloseButton={false}
          data-lenis-prevent
        >
          {active ? (
            <>
              <DialogClose
                render={
                  <button
                    className="dialog-close icon-button"
                    aria-label={lang === 'zh' ? '关闭' : 'Close'}
                  />
                }
              >
                <X />
              </DialogClose>
              <img
                className="dialog-image"
                src={`/media/cases/${active.id}.webp`}
                alt={active.title[lang]}
                width="960"
                height="640"
              />
              <div className="dialog-copy">
                <p className="eyebrow">{active.kind}</p>
                <DialogTitle>{active.title[lang]}</DialogTitle>
                <DialogDescription>{active.desc[lang]}</DialogDescription>
                <p className="fine-print">
                  {lang === 'zh'
                    ? '场景素材展示；具体项目配置以双方确认的技术方案为准。'
                    : 'Application imagery. Project specifications are subject to an agreed technical proposal.'}
                </p>
                <a
                  className="pill primary"
                  href={`/service?lang=${lang}#inquiry`}
                >
                  {lang === 'zh'
                    ? '咨询类似场景'
                    : 'Discuss a similar application'}
                  <ArrowUpRight size={18} />
                </a>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
