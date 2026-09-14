'use client';
import { lazy, Suspense, useSyncExternalStore, useState } from 'react';
import { Box, ArrowUpRight } from 'lucide-react';
import { storyProducts } from '@/lib/content';
import { useLanguage, subscribeLocation } from './provider';
import { Film } from './media';
import { ContactBand } from './chrome';
const ModelViewer = lazy(() => import('./model-viewer'));
function readModel() {
  const params = new URLSearchParams(location.search);
  for (const candidate of [params.get('model'), params.get('product')]) {
    const id = candidate === 'open-frame' ? 'open-frame-small' : candidate;
    const selected = storyProducts.find((p) => p.id === id);
    if (selected) return selected.id;
  }
  return 'open-frame-small';
}

export function ShowroomPage() {
  const { lang } = useLanguage();
  const id = useSyncExternalStore(
    subscribeLocation,
    readModel,
    () => 'open-frame-small',
  );
  const [load, setLoad] = useState(false);
  const selected = storyProducts.find((p) => p.id === id)!;
  const range = selected.rangeLabel?.[lang] ?? selected.range;
  return (
    <main id="main">
      <section className="showroom">
        <div className="showroom-head">
          <div>
            <p className="eyebrow">THE DIGITAL SHOWROOM</p>
            <h1>
              {lang === 'zh'
                ? '换个角度，看动力。'
                : 'A different view of power.'}
            </h1>
          </div>
          <p>
            {lang === 'zh'
              ? '选择开架、静音箱或集装箱机组，查看外观预览，也可以打开三维模型，自由查看设备布局。产品模型仅作外观展示。'
              : 'Choose an open, silent or container generator, then explore the preview or open its 3D model. Product models illustrate appearance; please refer to the confirmed configuration drawings.'}
          </p>
        </div>
        <div className="showroom-layout">
          <div
            className="model-selector"
            aria-label={lang === 'zh' ? '选择产品' : 'Select product'}
          >
            {storyProducts.map((p) => (
              <button
                key={p.id}
                aria-pressed={id === p.id}
                onClick={() => {
                  const url = new URL(location.href);
                  url.searchParams.set('model', p.id);
                  url.searchParams.set('product', p.id);
                  history.replaceState(null, '', url);
                  window.dispatchEvent(new Event('flydeer:location'));
                }}
              >
                {p.name[lang]}
                <strong>{p.rangeLabel?.[lang] ?? p.range}</strong>
              </button>
            ))}
          </div>
          <div>
            <div className="model-stage">
              {load ? (
                <Suspense
                  fallback={
                    <output className="model-status">
                      {lang === 'zh'
                        ? '正在准备展厅…'
                        : 'Preparing the showroom…'}
                    </output>
                  }
                >
                  <ModelViewer
                    key={`${id}-${lang}`}
                    id={id}
                    onClose={() => setLoad(false)}
                  />
                </Suspense>
              ) : (
                <>
                  {id === 'open-frame-small' ? (
                    <Film src={`/media/products/${id}.mp4`} controls />
                  ) : (
                    <img
                      src={`/media/story/${id}/poster.webp`}
                      className="journey-fallback"
                      alt={selected.name[lang]}
                    />
                  )}
                  <div className="model-launch">
                    <button
                      className="pill primary"
                      onClick={() => setLoad(true)}
                    >
                      <Box size={18} />
                      {lang === 'zh' ? '打开三维模型' : 'Open 3D model'}
                    </button>
                    <p>
                      {lang === 'zh'
                        ? '按需加载 · 支持拖动与键盘'
                        : 'Loads on request · Drag and keyboard controls'}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="showroom-foot">
              <span>
                {selected.name[lang]} / {range}
              </span>
              <a className="text-link" href={`/products/${id}?lang=${lang}`}>
                {lang === 'zh' ? '查看产品信息' : 'Product information'}
                <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </section>
      <ContactBand />
    </main>
  );
}
