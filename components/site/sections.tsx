'use client';
import { process } from '@/lib/content';
import { useLanguage } from './provider';

export function ProcessStory() {
  const { lang } = useLanguage();
  return (
    <section
      className="process-story"
      data-horizontal
      aria-label={
        lang === 'zh' ? '从制造到交付' : 'From manufacturing to delivery'
      }
    >
      <div className="story-top">
        <span className="eyebrow">FROM WORKSHOP TO YOUR WORLD.</span>
        <span>
          {lang === 'zh' ? '向下滚动，向前抵达' : 'SCROLL DOWN. MOVE FORWARD.'}
        </span>
      </div>
      <div className="story-track" data-track>
        {process.map((step, i) => (
          <article className="story-panel" key={step.image}>
            <div className="story-copy">
              <p className="eyebrow">
                <span>{String(i + 1).padStart(2, '0')}</span> /{' '}
                {step.label[lang]}
              </p>
              <h2>{step.title[lang]}</h2>
              <p>{step.body[lang]}</p>
              <div className="story-steps" aria-hidden="true">
                {process.map((p, j) => (
                  <span key={p.image} className={i === j ? 'active' : ''}>
                    {p.label[lang]}
                  </span>
                ))}
              </div>
            </div>
            <div className="story-image">
              <img
                src={`/media/company/${step.image}`}
                alt={step.label[lang]}
                width="1440"
                height="1000"
                loading="lazy"
              />
            </div>
          </article>
        ))}
      </div>
      <div className="story-progress">
        <div data-progress />
      </div>
    </section>
  );
}
