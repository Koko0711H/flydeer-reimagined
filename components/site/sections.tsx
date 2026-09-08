'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUpRight, ArrowRight } from 'lucide-react';
import { process } from '@/lib/content';
import { useLanguage } from './provider';
import { Film } from './media';
export { ProductTheater } from './product-journey';

export function Hero() {
  const { lang } = useLanguage();
  return (
    <section className="hero">
      <div className="hero-sticky">
        <Film
          src="/media/hero.mp4"
          mobile="/media/hero-mobile.mp4"
          poster="/media/company/poster.webp"
          className="hero-film"
          controls
        />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow hero-enter">FLYDEER POWER · 深柴能源</p>
          <h1 className="hero-enter">
            {lang === 'zh' ? (
              <>
                让动力，
                <br />
                <span>走得更远。</span>
              </>
            ) : (
              <>
                Power.
                <br />
                <span>Beyond limits.</span>
              </>
            )}
          </h1>
          <p className="hero-description hero-enter">
            {lang === 'zh' ? (
              <>
                从一台发电机组，到每一个用电现场。
                <br />
                以可靠动力，回应不同工况的需要。
              </>
            ) : (
              <>
                From a generator set to the place it matters.
                <br />
                Dependable power for a world of possibilities.
              </>
            )}
          </p>
          <a className="pill light hero-enter" href="#products">
            {lang === 'zh' ? '探索产品' : 'Explore our products'}
            <ArrowUpRight size={20} />
          </a>
        </div>
        <div className="hero-bottom">
          <span>ENGINEERED FOR YOUR WORLD.</span>
          <a href="#why">
            {lang === 'zh' ? '向下探索' : 'Scroll to explore'}
            <ArrowDown size={18} />
          </a>
          <span>
            {lang === 'zh'
              ? '发电 · 配电 · 现场服务'
              : 'GENERATION · DISTRIBUTION · SERVICE'}
          </span>
        </div>
      </div>
    </section>
  );
}
export function WhySection() {
  const { lang } = useLanguage();
  const reasons = [
    {
      title: lang === 'zh' ? '从需求出发' : 'Start with the requirement',
      body:
        lang === 'zh'
          ? '围绕负载、工况与设备空间，选择合适的动力配置。'
          : 'Configuration starts with loads, operating conditions and available space.',
    },
    {
      title: lang === 'zh' ? '让制造看得见' : 'Make the process visible',
      body:
        lang === 'zh'
          ? '加工、装配、整机检查，关注从部件到系统的每一步。'
          : 'Fabrication, assembly and complete-set checks: attention from parts to system.',
    },
    {
      title: lang === 'zh' ? '把交付想在前面' : 'Plan beyond the factory',
      body:
        lang === 'zh'
          ? '从运输落位到维护条件，将现场需求提前纳入方案。'
          : 'Account for transport, positioning and maintenance before delivery.',
    },
  ];
  return (
    <section className="why-section wrap" id="why">
      <div className="why-statement" data-reveal>
        <p className="eyebrow">WHY FLYDEER</p>
        <h2>
          {lang === 'zh' ? (
            <>
              不止提供设备。
              <br />
              <span>更理解现场。</span>
            </>
          ) : (
            <>
              More than equipment.
              <br />
              <span>An understanding of your site.</span>
            </>
          )}
        </h2>
      </div>
      <div className="why-points">
        {reasons.map((r) => (
          <article key={r.title} data-reveal>
            <h3>{r.title}</h3>
            <p>{r.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function IndustrySection() {
  const { lang } = useLanguage();
  const [active, setActive] = useState(0);
  const industries = [
    {
      image: 'manufacturing-campus',
      name: lang === 'zh' ? '工业制造' : 'Manufacturing',
      body:
        lang === 'zh'
          ? '为生产、公用设施与现场配套用电，寻找适合工况的动力方案。'
          : 'Power planning for production, utilities and equipment under real working conditions.',
    },
    {
      image: 'public-service',
      name: lang === 'zh' ? '公共服务' : 'Public services',
      body:
        lang === 'zh'
          ? '围绕关键负载与场所运行需求，规划备用电源。'
          : 'Backup power planning around critical loads and facility operation.',
    },
    {
      image: 'rail-hub',
      name: lang === 'zh' ? '基础设施' : 'Infrastructure',
      body:
        lang === 'zh'
          ? '从交通到通信，衔接复杂现场的供电要求。'
          : 'Connecting power requirements across transport and communications.',
    },
    {
      image: 'mountain-hospitality',
      name: lang === 'zh' ? '商业与旅居' : 'Hospitality',
      body:
        lang === 'zh'
          ? '考虑场地、声音与运行方式，让动力融入日常体验。'
          : 'Considering space, sound and operation to fit the everyday experience.',
    },
  ];
  return (
    <section className="industry-section wrap" id="industries">
      <div className="industry-image">
        <img
          key={active}
          src={`/media/cases/${industries[active].image}.webp`}
          width="960"
          height="850"
          alt={industries[active].name}
          loading="lazy"
        />
        <span>{lang === 'zh' ? '聚焦行业' : 'BUILT AROUND YOUR INDUSTRY'}</span>
      </div>
      <div className="industry-copy">
        <p className="eyebrow">BUILT AROUND YOUR INDUSTRY</p>
        <h2>
          {lang === 'zh' ? (
            <>
              理解需要，
              <br />
              才有合适的动力。
            </>
          ) : (
            <>
              Understand the need.
              <br />
              Find the right power.
            </>
          )}
        </h2>
        <div className="industry-options">
          {industries.map((item, i) => (
            <div
              key={item.image}
              className={
                active === i ? 'industry-item active' : 'industry-item'
              }
            >
              <button
                onClick={() => setActive(i)}
                aria-expanded={active === i}
                aria-controls={`industry-${i}`}
              >
                {item.name}
                <ArrowRight size={21} />
              </button>
              <div id={`industry-${i}`} hidden={active !== i}>
                <p>{item.body}</p>
                <a href={`/cases?lang=${lang}`}>
                  {lang === 'zh' ? '探索应用' : 'Explore applications'}
                  <ArrowUpRight size={15} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function CompanyTeaser() {
  const { lang } = useLanguage();
  return (
    <section className="company-teaser" id="company">
      <div className="company-sticky">
        <div className="company-image">
          <img
            data-company-photo
            src="/media/company/factory-assembly.webp"
            alt={lang === 'zh' ? '机组装配车间' : 'Generator assembly workshop'}
            width="1491"
            height="1056"
            loading="lazy"
          />
          <img
            data-company-photo
            src="/media/company/factory-testing-center.webp"
            alt={
              lang === 'zh' ? '整机检测区域' : 'Complete-set inspection area'
            }
            width="1440"
            height="1000"
            loading="lazy"
          />
          <img
            data-company-photo
            src="/media/company/delivery/delivery-site-05.webp"
            alt={lang === 'zh' ? '现场交付' : 'On-site delivery'}
            width="1440"
            height="1000"
            loading="lazy"
          />
          <div className="company-photo-labels" aria-hidden="true">
            <span data-company-label>
              01 / {lang === 'zh' ? '制造' : 'MANUFACTURING'}
            </span>
            <span data-company-label>
              02 / {lang === 'zh' ? '检查' : 'INSPECTION'}
            </span>
            <span data-company-label>
              03 / {lang === 'zh' ? '交付' : 'DELIVERY'}
            </span>
          </div>
        </div>
        <div className="company-copy" data-reveal>
          <p className="eyebrow">MEET FLYDEER</p>
          <h2>
            {lang === 'zh' ? (
              <>
                从制造的细节，
                <br />
                到交付的每一步。
              </>
            ) : (
              <>
                From workshop detail
                <br />
                to on-site delivery.
              </>
            )}
          </h2>
          <p>
            {lang === 'zh'
              ? '深柴能源，聚焦发电机组与配电解决方案。把设备制造与现场需求连接起来，是我们工作的起点。'
              : 'FlyDeer focuses on generator sets and power distribution solutions. Our work begins by connecting equipment manufacturing with site requirements.'}
          </p>
          <a className="pill light" href={`/about?lang=${lang}`}>
            {lang === 'zh' ? '走进深柴' : 'Meet FlyDeer'}
            <ArrowUpRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}
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
