'use client';
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Lang } from '@/lib/content';

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({ lang: 'zh', setLang: () => {} });
export const useLanguage = () => useContext(LanguageContext);
export function subscribeLocation(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener('flydeer:location', listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener('flydeer:location', listener);
    window.removeEventListener('storage', listener);
  };
}
function readLanguage(): Lang {
  const query = new URLSearchParams(location.search).get('lang');
  if (query) return query === 'en' ? 'en' : 'zh';
  try {
    return localStorage.getItem('flydeer.language') === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
}
export function SiteProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(
    subscribeLocation,
    readLanguage,
    () => 'zh' as Lang,
  );
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    const frame = requestAnimationFrame(() =>
      window.dispatchEvent(new Event('flydeer:layout')),
    );
    return () => cancelAnimationFrame(frame);
  }, [lang]);
  const setLang = (value: Lang) => {
    try {
      localStorage.setItem('flydeer.language', value);
    } catch {
      /* Keep navigation usable without storage. */
    }
    const url = new URL(location.href);
    url.searchParams.set('lang', value);
    history.replaceState(null, '', url);
    window.dispatchEvent(new Event('flydeer:location'));
  };
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
