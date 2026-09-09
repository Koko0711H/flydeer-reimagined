'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Play,
  X,
} from 'lucide-react';
import { cases, contact, products, process } from '@/lib/content';
import { brochure } from '@/lib/brochure';
import { useLanguage } from './provider';
import { STORY_CHAPTER_HEIGHT } from '@/lib/story-math.mjs';
import { StoryStage } from './story-stage';
import { Film } from './media';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

// One visual world crosses eight document chapters. The same generator carries
// the journey; product selection only changes the independent information panel.
export function PowerStory() {
  const { lang } = useLanguage();
  const [product, setProduct] = useState(2);
  const [application, setApplication] = useState(0);
  const [industry, setIndustry] = useState(0);
  const [productOpen, setProductOpen] = useState(false);
  const [caseOpen, setCaseOpen] = useState(false);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('flydeer:overlay', { detail: productOpen || caseOpen }),
    );
    return () => {
      if (productOpen || caseOpen)
        window.dispatchEvent(
          new CustomEvent('flydeer:overlay', { detail: false }),
        );
    };
  }, [productOpen, caseOpen]);
  const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const item = products[product];
  const site = cases[application];
  const industries = [
    {
      name: t('工业制造', 'Manufacturing'),
      desc: t(
        '从生产设备到公用设施，围绕负载和工况配置动力。',
        'Power configured around production loads, utilities and operating conditions.',
      ),
      image: 'manufacturing-campus',
    },
    {
      name: t('公共服务', 'Public services'),
      desc: t(
        '围绕关键负载与场所运行需求，规划备用电源。',
        'Backup planning around critical loads and facility operations.',
      ),
      image: 'public-service',
    },
    {
      name: t('基础设施', 'Infrastructure'),
      desc: t(
        '从交通到通信，衔接复杂现场的供电要求。',
        'Connecting power requirements across transport and communications.',
      ),
      image: 'rail-hub',
    },
    {
      name: t('商业与旅居', 'Hospitality'),
      desc: t(
        '考虑空间、声音与运行方式，让动力融入日常。',
        'Considering space, sound and operation to fit the everyday experience.',
      ),
      image: 'mountain-hospitality',
    },
  ];
  return (
    <main
      id="main"
      className="power-story"
      data-story-owner="home"
      style={
        { '--chapter-length': `${STORY_CHAPTER_HEIGHT}svh` } as CSSProperties
      }
    >
      <StoryStage application={site.id} industry={industries[industry].image} />
      <section
        className="power-chapter power-opening"
        data-chapter="0"
        id="start"
      >
        <div className="power-shot">
          <div className="opening-copy">
            <p className="power-signature">
              FRS POWER <span>福瑞斯</span>
            </p>
            <h1>
              {t('让动力，', 'Power, made')}
              <br />
              <em>{t('抵达每个现场。', 'to go further.')}</em>
            </h1>
            <p>
              {t(
                '柴油发电机组与电力系统。研发、制造、安装与维护，连接每一步。',
                'Diesel generator sets and power systems. Development, manufacturing, installation and maintenance, connected.',
              )}
            </p>
            <a className="power-link" href="#products">
              {t('探索动力', 'Explore our power')}
              <ArrowDown size={18} />
            </a>
          </div>
          <img
            className="power-static-machine"
            src="/media/story/poster.webp"
            alt={t('福瑞斯开架发电机组', 'FRS POWER open-frame generator')}
            width="1400"
            height="1000"
          />
          <div className="power-shot-foot">
            <span>ENGINEERED TO GO FURTHER.</span>
            <a href="#products">
              <ArrowDown size={15} />
              {t('向下，启程', 'Scroll to begin')}
            </a>
          </div>
        </div>
      </section>
      <section
        className="power-chapter power-products"
        data-chapter="1"
        id="products"
      >
        <div className="power-shot">
          <div className="power-copy power-copy-left">
            <p className="power-caption">
              {t('动力的起点', 'THE STARTING POINT')}
            </p>
            <h2>
              {t('合适的动力。', 'The right power.')}
              <br />
              <em>{t('从您的需要开始。', 'Built around you.')}</em>
            </h2>
            <fieldset
              className="power-product-list"
              id="product-range"
              aria-label={t('选择产品类型', 'Choose a product type')}
            >
              {products.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setProduct(i)}
                  aria-pressed={product === i}
                >
                  <span>{p.name[lang]}</span>
                  <small>{p.range}</small>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </fieldset>
            <div className="power-product-detail" aria-live="polite">
              <p>{item.desc[lang]}</p>
              <button
                className="power-link power-video-button"
                onClick={() => setProductOpen(true)}
              >
                <Play size={15} />
                {t('观看产品演示', 'Watch product film')}
              </button>
              <div className="power-links">
                <a
                  className="power-link"
                  href={`/products/${item.id}?lang=${lang}`}
                >
                  {t('了解产品', 'View product')}
                  <ArrowUpRight size={17} />
                </a>
                <a
                  className="power-link"
                  href={`/showroom?lang=${lang}&model=${item.id}`}
                >
                  <Box size={17} />
                  {t('3D 展厅', '3D showroom')}
                </a>
              </div>
              <a
                className="power-link power-catalog-link"
                href={`/products?lang=${lang}#engine-series`}
              >
                {t('按发动机与频率查找配置', 'Browse engine configurations')}
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <img
            className="power-static-scene"
            src="/media/story/frame-0001.webp"
            alt={t('标准开架机组', 'Standard open generator')}
            width="1400"
            height="1000"
            loading="lazy"
          />
          <div className="power-object-label">
            <span>OPEN FRAME</span>
            <span>{t('标准开架机组', 'Standard open generator')}</span>
          </div>
        </div>
      </section>
      <section
        className="power-chapter power-making"
        data-chapter="2"
        id="company"
      >
        <div className="power-shot">
          <img
            className="power-static-scene"
            src="/media/story/frame-0026.webp"
            alt={t('机组吊装', 'Generator lifting')}
            width="1400"
            height="1000"
            loading="lazy"
          />
          <div className="power-copy power-copy-right">
            <p className="power-caption">
              {t('从工厂出发', 'FROM THE WORKSHOP')}
            </p>
            <h2>
              {t('每一步制造。', 'Considered at every step.')}
              <br />
              {t('都为运行准备。', 'Built for operation.')}
            </h2>
            <p>{brochure.manufacturing[lang]}</p>
            <div className="power-process">
              {process.slice(0, 3).map((p) => (
                <a href={`/about?lang=${lang}`} key={p.image}>
                  <img
                    src={`/media/company/${p.image}`}
                    alt={p.label[lang]}
                    width="170"
                    height="110"
                    loading="lazy"
                  />
                  <span>{p.label[lang]}</span>
                </a>
              ))}
            </div>
            <a className="power-link" href={`/about?lang=${lang}`}>
              {t('走进福瑞斯', 'Inside FRS POWER')}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </section>
      <section
        className="power-chapter power-detail"
        data-chapter="3"
        id="showroom"
      >
        <span id="why" className="power-anchor" />
        <div className="power-shot">
          <img
            className="power-static-scene"
            src="/media/story/frame-0034.webp"
            alt={t('机组正面结构', 'Front of the generator')}
            width="1400"
            height="1000"
            loading="lazy"
          />
          <div className="power-copy power-copy-left">
            <p className="power-caption">
              {t('换个角度，看细节', 'A CLOSER LOOK')}
            </p>
            <h2>
              {t('整机协同。', 'Working as one.')}
              <br />
              <em>{t('配置因您而定。', 'Configured for you.')}</em>
            </h2>
            <p>{brochure.controls[lang]}</p>
            <dl className="power-details">
              <div>
                <dt>{t('控制', 'Control')}</dt>
                <dd>
                  {t('集成控制与运行监测', 'Integrated control and monitoring')}
                </dd>
              </div>
              <div>
                <dt>{t('并机', 'Paralleling')}</dt>
                <dd>{t('多机同步配置', 'Synchronized multi-set options')}</dd>
              </div>
              <div>
                <dt>{t('辅助', 'Auxiliaries')}</dt>
                <dd>
                  {t('储油、预热与消声', 'Fuel, preheating and silencing')}
                </dd>
              </div>
            </dl>
            <a
              className="power-link"
              href={`/showroom?lang=${lang}&model=open-frame-small`}
            >
              <Box size={18} />
              {t('自由查看每个角度', 'Explore every angle')}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </section>
      <section
        className="power-chapter power-loading"
        data-chapter="4"
        id="delivery"
      >
        <div className="power-shot">
          <img
            className="power-static-scene"
            src="/media/story/frame-0076.webp"
            alt={t('机组装入集装箱', 'Loading the generator')}
            width="1400"
            height="1000"
            loading="lazy"
          />
          <div className="loading-copy">
            <p className="power-caption">
              {t('为下一程，就位', 'READY FOR THE NEXT CHAPTER')}
            </p>
            <h2>
              {t('装箱，就位。', 'Integrated. Protected.')}
              <br />
              <em>{t('准备抵达。', 'Ready to go.')}</em>
            </h2>
          </div>
          <p className="power-loading-note">
            {t(
              '集成发电、冷却、排气与控制系统。让运输、落位和维护，在出发前就有安排。',
              'Generation, cooling, exhaust and controls together. Plan transport, positioning and service access before departure.',
            )}
          </p>
        </div>
      </section>
      <section
        className="power-chapter power-industries"
        data-chapter="5"
        id="industries"
      >
        <div className="power-shot">
          <img
            className="power-static-scene"
            src="/media/story/frame-0110.webp"
            alt={t('福瑞斯运输卡车', 'FRS POWER delivery truck')}
            width="1400"
            height="1000"
            loading="lazy"
          />
          <div className="power-industry-heading">
            <p className="power-caption">
              {t('动力，驶向需要', 'POWER ON ITS WAY')}
            </p>
            <h2>
              {t('一路向前。', 'On the move.')}
              <br />
              <em>{t('连接每一种现场。', 'For every setting.')}</em>
            </h2>
          </div>
          <div className="power-industry-picker">
            <fieldset
              className="power-industry-nav"
              aria-label={t('应用行业', 'Industries')}
            >
              {industries.map((i, n) => (
                <button
                  key={i.image}
                  aria-pressed={industry === n}
                  onClick={() => setIndustry(n)}
                >
                  {i.name}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </fieldset>
            <p aria-live="polite">{industries[industry].desc}</p>
            <a className="power-link" href="#cases">
              {t('抵达现场', 'Explore the settings')}
              <ArrowDown size={17} />
            </a>
          </div>
        </div>
      </section>
      <section
        className="power-chapter power-applications"
        data-chapter="6"
        id="cases"
      >
        <div className="power-shot">
          <img
            className="power-static-scene power-static-site"
            src={`/media/cases/${site.id}.webp`}
            alt={site.title[lang]}
            width="960"
            height="720"
            loading="lazy"
          />
          <div className="power-app-heading">
            <p className="power-caption">
              {t('让动力落地', 'POWER IN THE REAL WORLD')}
            </p>
            <h2>
              {t('抵达，', 'Arrive.')}
              <br />
              {t('才是新的开始。', 'Make a difference.')}
            </h2>
          </div>
          <div className="power-case-copy" aria-live="polite">
            <p className="power-caption">{site.kind}</p>
            <h3>{site.title[lang]}</h3>
            <p>{site.desc[lang]}</p>
            <button
              className="power-link power-video-button"
              onClick={() => setCaseOpen(true)}
            >
              {t('查看场景详情', 'View setting details')}
              <ArrowUpRight size={17} />
            </button>
            <a className="power-link" href={`/service?lang=${lang}#inquiry`}>
              {t('咨询类似场景', 'Discuss a similar setting')}
              <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="power-case-controls">
            <button
              aria-label={t('上一个场景', 'Previous setting')}
              onClick={() =>
                setApplication((application + cases.length - 1) % cases.length)
              }
            >
              <ArrowLeft size={20} />
            </button>
            <span>
              {String(application + 1).padStart(2, '0')} /{' '}
              {String(cases.length).padStart(2, '0')}
            </span>
            <button
              aria-label={t('下一个场景', 'Next setting')}
              onClick={() => setApplication((application + 1) % cases.length)}
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <fieldset
            className="power-case-strip"
            aria-label={t('选择应用场景', 'Choose an application')}
          >
            {cases.map((c, i) => (
              <button
                key={c.id}
                aria-label={c.title[lang]}
                aria-pressed={application === i}
                onClick={() => setApplication(i)}
              >
                <img
                  src={`/media/cases/${c.id}.webp`}
                  alt=""
                  width="112"
                  height="70"
                  loading="lazy"
                />
                <span>{c.title[lang]}</span>
              </button>
            ))}
          </fieldset>
          <a
            className="power-all-cases power-link"
            href={`/cases?lang=${lang}`}
          >
            {t('全部应用场景', 'All applications')}
            <ArrowUpRight size={17} />
          </a>
        </div>
      </section>
      <section
        className="power-chapter power-contact"
        data-chapter="7"
        id="contact"
      >
        <div className="power-shot">
          <div className="power-contact-copy">
            <p className="power-caption">LET’S POWER WHAT’S NEXT.</p>
            <h2>
              {t('下一个现场，', 'Your next site.')}
              <br />
              <em>{t('一起抵达。', 'Our next journey.')}</em>
            </h2>
            <p>{brochure.service[lang]}</p>
            <a className="pill primary" href={`/service?lang=${lang}#inquiry`}>
              {t('聊聊您的项目', 'Discuss your project')}
              <ArrowUpRight size={19} />
            </a>
            <a className="power-contact-phone" href={contact.tel}>
              {contact.phone}
            </a>
          </div>
          <div className="power-endmark" aria-hidden="true">
            FRS POWER
          </div>
        </div>
      </section>
      <Dialog open={productOpen} onOpenChange={setProductOpen}>
        <DialogContent
          className="power-product-dialog"
          showCloseButton={false}
          data-lenis-prevent
        >
          <DialogClose
            render={
              <button
                className="dialog-close icon-button"
                aria-label={t('关闭', 'Close')}
              />
            }
          >
            <X />
          </DialogClose>
          <Film src={`/media/products/${item.id}.mp4`} controls />
          <div className="dialog-copy">
            <DialogTitle>{item.name[lang]}</DialogTitle>
            <DialogDescription>{item.desc[lang]}</DialogDescription>
            <p>{item.range}</p>
            <a
              className="power-link"
              href={`/products/${item.id}?lang=${lang}`}
            >
              {t('查看型号与配置', 'View product details')}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={caseOpen} onOpenChange={setCaseOpen}>
        <DialogContent
          className="case-dialog"
          showCloseButton={false}
          data-lenis-prevent
        >
          <DialogClose
            render={
              <button
                className="dialog-close icon-button"
                aria-label={t('关闭', 'Close')}
              />
            }
          >
            <X />
          </DialogClose>
          <img
            className="dialog-image"
            src={`/media/cases/${site.id}.webp`}
            alt={site.title[lang]}
            width="960"
            height="640"
          />
          <div className="dialog-copy">
            <DialogTitle>{site.title[lang]}</DialogTitle>
            <DialogDescription>{site.desc[lang]}</DialogDescription>
            <p className="fine-print">
              {t(
                '场景素材展示；具体项目配置以双方确认的技术方案为准。',
                'Application imagery. Project specifications are subject to an agreed technical proposal.',
              )}
            </p>
            <a className="pill primary" href={`/service?lang=${lang}#inquiry`}>
              {t('咨询类似场景', 'Discuss a similar setting')}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
