'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { KineticCases } from './kinetic-cases';
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
  const [filter, setFilter] = useState('all');
  const visible = cases.filter(
    (item) => filter === 'all' || item.category === filter,
  );
  return (
    <>
      <section
        className={`case-section ${grid ? 'case-section-grid' : 'case-kinetic'}`}
        id="cases"
        aria-label={lang === 'zh' ? '项目应用场景' : 'Project applications'}
      >
        <div className={grid ? undefined : 'case-kinetic-sticky'}>
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
              aria-label={
                lang === 'zh' ? '按场景筛选' : 'Filter by application'
              }
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
          {grid ? (
            <div className="case-grid wrap">
              <div className="case-grid-inner">
                {visible.map((item) => (
                  <div key={item.id} className="case-slide">
                    <button
                      className="case-card"
                      onClick={() => setActive(item)}
                      aria-label={item.title[lang]}
                    >
                      <img
                        src={`/media/cases/${item.id}.webp`}
                        alt={item.title[lang]}
                        width="960"
                        height="720"
                        loading="lazy"
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
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <KineticCases onOpen={setActive} />
          )}
          {!grid ? (
            <div className="wrap case-more">
              <a className="text-link" href={`/cases?lang=${lang}`}>
                {lang === 'zh'
                  ? '查看全部应用场景'
                  : 'Explore all applications'}
                <ArrowUpRight size={20} />
              </a>
            </div>
          ) : null}
        </div>
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
