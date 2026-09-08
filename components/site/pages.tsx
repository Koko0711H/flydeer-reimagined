'use client';
import { useState, type SubmitEvent } from 'react';
import { ArrowUpRight, Box, Check, Mail } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { products, contact } from '@/lib/content';
import { useLanguage } from './provider';
import { Film } from './media';
import { ProcessStory } from './sections';
import { ContactBand } from './chrome';

export function ProductsPage() {
  const { lang } = useLanguage();
  return (
    <main id="main">
      <section className="page-hero">
        <p className="eyebrow">OUR POWER PORTFOLIO</p>
        <h1>
          {lang === 'zh' ? (
            <>
              为每一种需要，
              <br />
              找到合适的动力。
            </>
          ) : (
            <>
              The right power.
              <br />
              For your requirements.
            </>
          )}
        </h1>
        <p>
          {lang === 'zh'
            ? '从静音备用到工程供电，从移动电源到高压配电。按实际应用选择产品，进一步沟通设备配置。'
            : 'From enclosed standby sets to industrial generation, mobile power and distribution. Explore the range, then discuss your configuration.'}
        </p>
      </section>
      <section className="product-catalog wrap">
        {products.map((p) => (
          <article className="catalog-card" key={p.id} data-reveal>
            <div className="catalog-film">
              <Film src={`/media/products/${p.id}.mp4`} />
            </div>
            <div className="catalog-card-copy">
              <p className="eyebrow">{p.line}</p>
              <h2>{p.name[lang]}</h2>
              <p className="range">{p.range}</p>
              <p>{p.desc[lang]}</p>
              <a className="text-link" href={`/products/${p.id}?lang=${lang}`}>
                {lang === 'zh' ? '查看产品' : 'View product'}
                <ArrowUpRight />
              </a>
            </div>
          </article>
        ))}
      </section>
      <ContactBand />
    </main>
  );
}
export function ProductDetail({ id }: { id: string }) {
  const { lang } = useLanguage();
  const product = products.find((p) => p.id === id)!;
  return (
    <main id="main">
      <section className="detail-hero">
        <div className="wrap">
          <div className="detail-topline">
            <a href={`/products?lang=${lang}`}>
              {lang === 'zh' ? '产品中心' : 'Products'}
            </a>
            <span>/</span>
            <span>{product.name[lang]}</span>
          </div>
          <div className="detail-body">
            <div>
              <Film src={`/media/products/${id}.mp4`} />
            </div>
            <div className="detail-copy">
              <p className="eyebrow">{product.line}</p>
              <h1>{product.name[lang]}</h1>
              <p className="range">{product.range}</p>
              <p>{product.desc[lang]}</p>
              <div className="detail-actions">
                <a
                  className="pill primary"
                  href={`/service?lang=${lang}#inquiry`}
                >
                  {lang === 'zh' ? '咨询配置与报价' : 'Discuss specification'}
                  <ArrowUpRight size={18} />
                </a>
                <a
                  className="pill light"
                  href={`/showroom?lang=${lang}&model=${id}`}
                >
                  <Box size={18} />
                  {lang === 'zh' ? '3D 展厅' : '3D showroom'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="feature-row wrap">
        {product.features.map((f) => (
          <article key={f.zh} data-reveal>
            <Check size={24} />
            <h2>{f[lang]}</h2>
          </article>
        ))}
      </section>
      <section className="spec-note wrap">
        <h2>
          {lang === 'zh'
            ? '为实际工况，确认每项配置。'
            : 'Confirm the configuration for your conditions.'}
        </h2>
        <p>{product.uses[lang]}</p>
        <p>
          {lang === 'zh'
            ? '系列范围用于初步选型；设备功率、频率、电压、排放、声音表现与选装功能，以双方确认的具体型号及技术文件为准。请提供负载清单、运行环境与交付地点，我们将进一步沟通适用方案。'
            : 'The range supports initial selection. Power, frequency, voltage, emissions, sound performance and options depend on the agreed model and technical documentation. Share your load schedule, environment and delivery location to discuss a suitable configuration.'}
        </p>
      </section>
      <ContactBand />
    </main>
  );
}
export function AboutPage() {
  const { lang } = useLanguage();
  return (
    <main id="main">
      <section className="page-hero dark">
        <p className="eyebrow">WE ARE FRS POWER</p>
        <h1>
          {lang === 'zh' ? (
            <>
              深耕制造。
              <br />
              连接每个用电现场。
            </>
          ) : (
            <>
              Rooted in manufacturing.
              <br />
              Connected to your world.
            </>
          )}
        </h1>
        <p>
          {lang === 'zh'
            ? '一台设备的价值，最终在现场体现。我们从制造出发，也从您的实际需要出发。'
            : 'The value of equipment is realised on site. Our starting points are manufacturing and your practical requirements.'}
        </p>
      </section>
      <section className="about-intro wrap">
        <h2 data-reveal>
          {lang === 'zh' ? (
            <>
              把可靠的动力，
              <br />
              带到需要的地方。
            </>
          ) : (
            <>
              Bringing dependable power
              <br />
              where it is needed.
            </>
          )}
        </h2>
        <div data-reveal>
          <p>
            {lang === 'zh'
              ? '福瑞斯专注于发电机组及配电解决方案，产品涵盖静音型、开架型、移动拖车机组与高压配电系统。'
              : 'FRS POWER focuses on generator sets and power distribution solutions, spanning enclosed, open, trailer-mounted and high-voltage systems.'}
          </p>
          <p>
            {lang === 'zh'
              ? '从负载与工况沟通，到整机制造、检查和交付安排，我们关注设备如何适应实际现场，也关注后续运行与维护的便利。'
              : 'From load and operating-condition discussions to manufacturing, checks and delivery, we consider how equipment fits the site and how it will be operated and maintained.'}
          </p>
        </div>
      </section>
      <div className="about-film">
        <Film
          src="/media/company/film.mp4"
          poster="/media/company/poster.webp"
          controls
        />
      </div>
      <ProcessStory />
      <section className="location-row wrap">
        <h2>{lang === 'zh' ? '协同，向前。' : 'Working together.'}</h2>
        <article>
          <h3>{lang === 'zh' ? '研发' : 'Development'}</h3>
          <p>{lang === 'zh' ? '辽宁 · 沈阳' : 'Shenyang, Liaoning'}</p>
        </article>
        <article>
          <h3>{lang === 'zh' ? '生产' : 'Production'}</h3>
          <p>
            {lang === 'zh' ? '辽宁 · 沈阳' : 'Shenyang, Liaoning'}
            <br />
            {lang === 'zh' ? '福建 · 宁德' : 'Ningde, Fujian'}
          </p>
        </article>
        <article>
          <h3>{lang === 'zh' ? '运营' : 'Operations'}</h3>
          <p>{lang === 'zh' ? '福建 · 福州' : 'Fuzhou, Fujian'}</p>
        </article>
      </section>
      <ContactBand />
    </main>
  );
}
export function NewsPage() {
  const { lang } = useLanguage();
  return (
    <main id="main">
      <section className="page-hero">
        <p className="eyebrow">INSIDE FRS POWER</p>
        <h1>{lang === 'zh' ? '制造现场，持续发生。' : 'Inside the work.'}</h1>
        <p>
          {lang === 'zh'
            ? '关注产品、制造与交付。'
            : 'Products, manufacturing and delivery.'}
        </p>
      </section>
      <section className="empty-news wrap">
        <img
          src="/media/company/factory-work-bays.webp"
          alt={lang === 'zh' ? '生产车间' : 'Production workshop'}
          width="1200"
          height="960"
        />
        <div>
          <p className="eyebrow">COMPANY UPDATES</p>
          <h2>
            {lang === 'zh'
              ? '新的故事，正在整理。'
              : 'New stories are on the way.'}
          </h2>
          <p>
            {lang === 'zh'
              ? '目前暂无已发布新闻。您可以先走进我们的制造与交付流程，或直接联系团队了解最新产品信息。'
              : 'There are no published news articles yet. Explore our manufacturing and delivery process, or contact the team for product information.'}
          </p>
          <a className="pill primary" href={`/about?lang=${lang}`}>
            {lang === 'zh' ? '走进福瑞斯' : 'Meet FRS POWER'}
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <ContactBand />
    </main>
  );
}
export function ServicePage() {
  const { lang } = useLanguage();
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => {
      const value = data.get(name);
      return typeof value === 'string' ? value : '';
    };
    setDraft(
      `${lang === 'zh' ? '网站产品咨询' : 'Website product inquiry'}\n\n${lang === 'zh' ? '联系人' : 'Name'}: ${field('name')}\n${lang === 'zh' ? '回复方式' : 'Reply to'}: ${field('reply')}\n${lang === 'zh' ? '关注产品' : 'Product'}: ${field('product')}\n${lang === 'zh' ? '项目需求' : 'Requirements'}:\n${field('message')}`,
    );
    setCopied(false);
  };
  const faqs =
    lang === 'zh'
      ? [
          [
            '选型前需要提供哪些信息？',
            '请提供主要负载及启动方式、使用场景、备用或常用运行方式、所在地区、频率与电压要求、预计交付地点。设备功率应结合负载特性确认。',
          ],
          [
            '可以咨询并机、ATS 或远程监控吗？',
            '可以。请说明项目控制逻辑与现场接口要求，具体功能和兼容性需在技术方案中确认。',
          ],
          [
            '如何安排运输与现场安装？',
            '请提供场地入口、运输路径、卸载与吊装条件、机房尺寸及通风排烟条件，便于沟通实际交付安排。',
          ],
          [
            '如何获得售后支持？',
            '请通过现有电话、WhatsApp 或邮箱联系团队，并提供设备型号、序列号和现象说明。请勿自行进行带电或危险操作。',
          ],
        ]
      : [
          [
            'What information is needed for selection?',
            'Share your load schedule and starting method, application, standby or prime use, location, frequency and voltage requirements, and delivery destination. Rating selection depends on load characteristics.',
          ],
          [
            'Can we discuss parallel operation, ATS or monitoring?',
            'Yes. Tell us your control logic and interface requirements. The technical proposal must confirm specific functions and compatibility.',
          ],
          [
            'How do we plan transport and installation?',
            'Share access routes, unloading and lifting conditions, room dimensions, and ventilation and exhaust requirements so delivery arrangements can be discussed.',
          ],
          [
            'How do I request after-sales support?',
            'Contact the team by phone, WhatsApp or email with the model, serial number and a description of the issue. Do not attempt live electrical work or hazardous operations.',
          ],
        ];
  return (
    <main id="main">
      <section className="page-hero">
        <p className="eyebrow">LET’S TALK POWER</p>
        <h1>
          {lang === 'zh' ? (
            <>
              从您的需要，
              <br />
              开始下一步。
            </>
          ) : (
            <>
              Your requirements.
              <br />
              Our starting point.
            </>
          )}
        </h1>
        <p>
          {lang === 'zh'
            ? '产品选型、项目配置、交付与服务，直接与我们沟通。'
            : 'Talk to us about selection, configuration, delivery and service.'}
        </p>
      </section>
      <section className="service-content wrap" id="contact">
        <div className="service-contact">
          <h2>{lang === 'zh' ? '联系福瑞斯' : 'Contact FRS POWER'}</h2>
          <a className="large-phone" href={contact.tel}>
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <div className="contact-meta">
            <p>{contact.address[lang]}</p>
            <p>{contact.hours[lang]}</p>
          </div>
          <a
            className="pill primary"
            href={contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
            <ArrowUpRight size={19} />
          </a>
        </div>
        <form className="inquiry-form" onSubmit={submit} id="inquiry">
          <h2>{lang === 'zh' ? '整理您的项目需求' : 'Prepare your inquiry'}</h2>
          <p>
            {lang === 'zh'
              ? '此处仅生成邮件草稿，不会在网站上传或保存您的信息。'
              : 'This creates an email draft. Your information is not uploaded or stored by this website.'}
          </p>
          <label>
            {lang === 'zh' ? '您的称呼' : 'Your name'}
            <input required name="name" maxLength={100} autoComplete="name" />
          </label>
          <label>
            {lang === 'zh' ? '电话或邮箱' : 'Phone or email'}
            <input required name="reply" maxLength={200} autoComplete="email" />
          </label>
          <label>
            {lang === 'zh' ? '关注的产品' : 'Product interest'}
            <select name="product">
              {products.map((p) => (
                <option key={p.id} value={p.name[lang]}>
                  {p.name[lang]}
                </option>
              ))}
              <option>
                {lang === 'zh' ? '需要协助选型' : 'Help me choose'}
              </option>
            </select>
          </label>
          <label>
            {lang === 'zh'
              ? '负载、场景与交付地点'
              : 'Loads, application and destination'}
            <textarea name="message" required maxLength={3000} />
          </label>
          <button type="submit" className="pill primary">
            {lang === 'zh' ? '生成邮件草稿' : 'Create email draft'}
            <Mail size={18} />
          </button>
          {draft ? (
            <output className="inquiry-result">
              <p>
                {lang === 'zh'
                  ? '草稿已准备好，请打开邮件后确认发送；尚未发送任何信息。'
                  : 'Your draft is ready. Open your email app to review and send; nothing has been sent yet.'}
              </p>
              <a
                href={`mailto:${contact.email}?subject=${encodeURIComponent(lang === 'zh' ? '网站产品咨询' : 'Website product inquiry')}&body=${encodeURIComponent(draft)}`}
              >
                {lang === 'zh' ? '打开邮件应用' : 'Open email app'}
                <ArrowUpRight size={15} />
              </a>
              <button
                type="button"
                className="text-link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(draft);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied
                  ? lang === 'zh'
                    ? '已复制'
                    : 'Copied'
                  : lang === 'zh'
                    ? '复制草稿'
                    : 'Copy draft'}
              </button>
            </output>
          ) : null}
        </form>
      </section>
      <section className="faq wrap">
        <h2>{lang === 'zh' ? '沟通前，您可能想知道。' : 'Before we talk.'}</h2>
        <Accordion>
          {faqs.map(([title, body], i) => (
            <AccordionItem value={i} key={title}>
              <AccordionTrigger>{title}</AccordionTrigger>
              <AccordionContent>{body}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
