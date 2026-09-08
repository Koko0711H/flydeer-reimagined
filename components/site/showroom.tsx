'use client';
import { lazy, Suspense, useSyncExternalStore, useState } from 'react';
import { Box, ArrowUpRight } from 'lucide-react';
import { products } from '@/lib/content';
import { useLanguage, subscribeLocation } from './provider';
import { Film } from './media';
import { ContactBand } from './chrome';
const ModelViewer = lazy(() => import('./model-viewer'));
function readModel() {
  const query = new URLSearchParams(location.search).get('model');
  return products.some((p) => p.id === query) ? query! : 'silent';
}

export function ShowroomPage() {
  const { lang } = useLanguage();
  const id = useSyncExternalStore(subscribeLocation, readModel, () => 'silent');
  const [load, setLoad] = useState(false);
  const selected = products.find((p) => p.id === id)!;
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
              ? '先看产品影像，也可以打开三维模型，自由查看设备布局。产品模型仅作外观展示。'
              : 'Explore product films, or open a 3D model to view the equipment layout. Product models illustrate appearance; please refer to the confirmed configuration drawings.'}
          </p>
        </div>
        <div className="showroom-layout">
          <div
            className="model-selector"
            aria-label={lang === 'zh' ? '选择产品' : 'Select product'}
          >
            {products.map((p) => (
              <button
                key={p.id}
                aria-pressed={id === p.id}
                onClick={() => {
                  setLoad(false);
                  const url = new URL(location.href);
                  url.searchParams.set('model', p.id);
                  history.replaceState(null, '', url);
                  window.dispatchEvent(new Event('flydeer:location'));
                }}
              >
                {p.name[lang]}
                <strong>{p.range}</strong>
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
                  <Film src={`/media/products/${id}.mp4`} controls />
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
                        ? '按需加载 · 约 3–14 MB · 支持拖动与键盘'
                        : 'Loads on request · Approx. 3–14 MB · Drag and keyboard controls'}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="showroom-foot">
              <span>
                {selected.name[lang]} / {selected.range}
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
