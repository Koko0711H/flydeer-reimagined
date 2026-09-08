'use client';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { products } from '@/lib/content';
import { productChapter } from '@/lib/motion-math.mjs';
import { useLanguage } from './provider';
import { Film } from './media';
import { scrollPageTo } from './scroll';

const Model = lazy(() => import('./model-viewer'));

export function ProductTheater() {
  const { lang } = useLanguage();
  const section = useRef<HTMLElement>(null);
  const pose = useRef(0.25);
  const selectChapter = useRef<(index: number) => void>(() => {});
  const [selected, setSelected] = useState(0);
  const [near, setNear] = useState(false);
  const [videoOnly, setVideoOnly] = useState(false);
  const product = products[selected];

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    let disposed = false;
    let cleanup = () => {};
    selectChapter.current = setSelected;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        cleanup = () => media.revert();
        media.add(
          '(prefers-reduced-motion: no-preference) and (min-height: 741px), (prefers-reduced-motion: no-preference) and (min-width: 761px) and (min-height: 621px)',
          () => {
            node.dataset.kinetic = 'true';
            const progress = { value: 0 };
            let current = 0;
            setSelected(0);
            const bar = node.querySelector<HTMLElement>(
              '.product-journey-progress span',
            );
            const numeral = node.querySelector<HTMLElement>(
              '.product-journey-numeral',
            );
            const tween = gsap.to(progress, {
              value: 1,
              ease: 'none',
              onUpdate: () => {
                const next = productChapter(progress.value, products.length);
                pose.current = next.phase;
                if (next.index !== current) {
                  current = next.index;
                  setSelected(current);
                }
                if (bar) bar.style.transform = `scaleX(${progress.value})`;
                if (numeral)
                  numeral.style.transform = `translateX(${-next.phase * 40}px)`;
              },
              scrollTrigger: {
                trigger: node,
                start: 'top 88px',
                end: () =>
                  `+=${Math.max(1, node.offsetHeight - (node.querySelector<HTMLElement>('.product-journey-sticky')?.offsetHeight ?? innerHeight))}`,
                scrub: 0.45,
                invalidateOnRefresh: true,
              },
            });
            const trigger = tween.scrollTrigger!;
            selectChapter.current = (index) => {
              const target =
                trigger.start +
                (trigger.end - trigger.start) *
                  ((index + 0.35) / products.length);
              scrollPageTo(target);
            };
            return () => {
              delete node.dataset.kinetic;
              selectChapter.current = setSelected;
              pose.current = 0.25;
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
      .catch((error: unknown) => {
        console.warn(
          '[FlyDeer] Product motion unavailable; product tabs remain usable.',
          error,
        );
      });
    return () => {
      disposed = true;
      observer.disconnect();
      cleanup();
    };
  }, []);

  return (
    <section
      ref={section}
      className="product-journey"
      id="products"
      aria-label={lang === 'zh' ? '产品动态展台' : 'Product journey'}
    >
      <div className="product-journey-sticky">
        <div className="journey-topline wrap">
          <p className="eyebrow">POWER, IN EVERY FORM.</p>
          <a className="text-link" href={`/products?lang=${lang}`}>
            {lang === 'zh' ? '所有产品' : 'All products'}
            <ArrowUpRight size={18} />
          </a>
        </div>
        <Tabs
          value={product.id}
          onValueChange={(value) => {
            const index = products.findIndex((item) => item.id === value);
            if (index >= 0) selectChapter.current(index);
          }}
          className="journey-tabs"
        >
          <div className="journey-composition wrap">
            <div className="journey-copy">
              <h2>
                {lang === 'zh' ? (
                  <>
                    不同现场。
                    <br />
                    <span>同样全力以赴。</span>
                  </>
                ) : (
                  <>
                    Different settings.
                    <br />
                    <span>The same commitment.</span>
                  </>
                )}
              </h2>
              {products.map((item, index) => (
                <TabsContent
                  key={item.id}
                  value={item.id}
                  className="journey-description"
                >
                  <p className="eyebrow">
                    0{index + 1} / {item.line}
                  </p>
                  <h3>{item.name[lang]}</h3>
                  <p className="product-range">{item.range}</p>
                  <p>{item.desc[lang]}</p>
                  <a
                    className="pill primary"
                    href={`/products/${item.id}?lang=${lang}`}
                  >
                    {lang === 'zh' ? '了解产品' : 'View product'}
                    <ArrowUpRight size={19} />
                  </a>
                </TabsContent>
              ))}
            </div>
            <div className="journey-object">
              <span className="product-journey-numeral" aria-hidden="true">
                0{selected + 1}
              </span>
              <div className="journey-model" key={product.id}>
                {near && !videoOnly ? (
                  <Suspense
                    fallback={
                      <Film
                        src={`/media/products/${product.id}.mp4`}
                        className="journey-fallback"
                      />
                    }
                  >
                    <Model
                      id={product.id}
                      presentation={pose}
                      onClose={() => setVideoOnly(true)}
                    />
                  </Suspense>
                ) : (
                  <Film
                    src={`/media/products/${product.id}.mp4`}
                    className="journey-fallback"
                  />
                )}
              </div>
              <div className="journey-object-foot">
                <span className="journey-scroll-hint">
                  <ArrowDown size={16} />
                  {lang === 'zh'
                    ? '下滑转动机组 · 连续探索'
                    : 'Scroll to turn · Keep exploring'}
                </span>
                <a href={`/showroom?lang=${lang}&model=${product.id}`}>
                  {lang === 'zh' ? '自由查看 3D' : 'Explore in 3D'}
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>
          <TabsList className="journey-nav wrap" variant="line">
            {products.map((item, index) => (
              <TabsTrigger key={item.id} value={item.id}>
                <span>0{index + 1}</span>
                {item.name[lang]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="product-journey-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
