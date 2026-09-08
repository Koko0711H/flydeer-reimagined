'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, ArrowUp, Menu, X, Phone, Mail } from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { contact, navigation } from '@/lib/content';
import { useLanguage } from './provider';

export function Header() {
  const { lang, setLang } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('flydeer:overlay', { detail: open }));
    return () => {
      if (open)
        window.dispatchEvent(
          new CustomEvent('flydeer:overlay', { detail: false }),
        );
    };
  }, [open]);
  return (
    <>
      <a className="skip-link" href="#main">
        {lang === 'zh' ? '跳到主要内容' : 'Skip to content'}
      </a>
      <header className="site-header">
        <a href={`/?lang=${lang}`} aria-label="FlyDeer">
          <img
            src="/media/logo.svg"
            alt="FlyDeer 深柴能源"
            className="brand"
            width="145"
            height="44"
          />
        </a>
        <nav aria-label={lang === 'zh' ? '主导航' : 'Main navigation'}>
          {navigation.slice(1).map((n) => (
            <a
              href={`${n.href}?lang=${lang}`}
              key={n.href}
              aria-current={pathname === n.href ? 'page' : undefined}
            >
              {n.label[lang]}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="language-toggle"
            aria-label={lang === 'zh' ? 'Switch to English' : '切换中文'}
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          >
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
          <a className="header-contact" href={`/service?lang=${lang}#contact`}>
            {lang === 'zh' ? '获取报价' : 'Get in touch'}
            <ArrowUpRight size={17} />
          </a>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <button
                  className="menu-toggle"
                  aria-label={lang === 'zh' ? '打开菜单' : 'Open menu'}
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent
              showCloseButton={false}
              className="navigation-sheet"
              data-lenis-prevent
            >
              <div className="sheet-top">
                <SheetTitle>FLYDEER</SheetTitle>
                <SheetClose
                  render={
                    <button
                      className="icon-button"
                      aria-label={lang === 'zh' ? '关闭菜单' : 'Close menu'}
                    />
                  }
                >
                  <X />
                </SheetClose>
              </div>
              <SheetDescription className="sr-only">
                {lang === 'zh' ? '网站导航' : 'Site navigation'}
              </SheetDescription>
              <nav>
                {navigation.map((n) => (
                  <a
                    key={n.href}
                    href={`${n.href}?lang=${lang}`}
                    onClick={() => setOpen(false)}
                  >
                    {n.label[lang]}
                    <ArrowUpRight />
                  </a>
                ))}
              </nav>
              <a href={contact.tel}>{contact.phone}</a>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
export function ContactBand() {
  const { lang } = useLanguage();
  return (
    <section className="contact-band" id="contact">
      <div data-reveal>
        <p className="eyebrow">LET’S POWER WHAT’S NEXT.</p>
        <h2>
          {lang === 'zh' ? (
            <>
              下一个现场，
              <br />
              一起抵达。
            </>
          ) : (
            <>
              Your next site.
              <br />
              Our next conversation.
            </>
          )}
        </h2>
      </div>
      <div className="contact-band-info" data-reveal>
        <p>
          {lang === 'zh'
            ? '告诉我们负载、应用场景与交付地点，从实际需求开始沟通。'
            : 'Tell us about your loads, application and destination. Let’s start with your requirements.'}
        </p>
        <a className="pill light" href={`/service?lang=${lang}#inquiry`}>
          {lang === 'zh' ? '聊聊您的项目' : 'Discuss your project'}
          <ArrowUpRight size={20} />
        </a>
        <a className="contact-phone" href={contact.tel}>
          {contact.phone}
        </a>
      </div>
    </section>
  );
}
export function Footer() {
  const { lang } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <img
            src="/media/logo.svg"
            alt="FlyDeer 深柴能源"
            width="145"
            height="44"
            className="brand"
          />
          <p>
            {lang === 'zh'
              ? '以可靠动力，回应每一种需要。'
              : 'Dependable power, for every possibility.'}
          </p>
        </div>
        <div className="footer-links">
          {navigation.slice(1).map((n) => (
            <a href={`${n.href}?lang=${lang}`} key={n.href}>
              {n.label[lang]}
            </a>
          ))}
        </div>
        <div className="footer-contact">
          <a href={contact.tel}>
            <Phone size={15} />
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`}>
            <Mail size={15} />
            {contact.email}
          </a>
          <p>{contact.address[lang]}</p>
          <p>{contact.hours[lang]}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} FLYDEER 深柴能源</span>
        <span>ENGINEERED FOR YOUR WORLD.</span>
        <a href="#main">
          {lang === 'zh' ? '返回顶部' : 'Back to top'}
          <ArrowUp size={15} />
        </a>
      </div>
    </footer>
  );
}
