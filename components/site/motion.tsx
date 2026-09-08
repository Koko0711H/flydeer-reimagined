'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function MotionSystem() {
  const path = usePathname();
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('lenis'),
    ])
      .then(([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        media.add('(prefers-reduced-motion: no-preference)', () => {
          gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
            gsap.from(el, {
              y: 32,
              autoAlpha: 0,
              duration: 0.85,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 94%', once: true },
            });
          });
          gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
            gsap.fromTo(
              el,
              { yPercent: -6 },
              {
                yPercent: 6,
                ease: 'none',
                scrollTrigger: {
                  trigger: el.parentElement,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          });
        });
        media.add(
          '(min-width: 1000px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
          () => {
            const lenis = new Lenis({
              lerp: 0.085,
              syncTouch: false,
              respectReducedMotion: true,
              anchors: { offset: -88 },
              prevent: (node) => node.hasAttribute('data-lenis-prevent'),
            });
            lenis.on('scroll', () => ScrollTrigger.update());
            const tick = (time: number) => lenis.raf(time * 1000);
            gsap.ticker.add(tick);
            const overlay = (event: Event) => {
              if ((event as CustomEvent<boolean>).detail) lenis.stop();
              else lenis.start();
            };
            window.addEventListener('flydeer:overlay', overlay);
            gsap.utils
              .toArray<HTMLElement>('[data-horizontal]')
              .forEach((section) => {
                const track =
                  section.querySelector<HTMLElement>('[data-track]');
                const line =
                  section.querySelector<HTMLElement>('[data-progress]');
                if (!track) return;
                const distance = () =>
                  Math.max(0, track.scrollWidth - section.clientWidth);
                gsap.to(track, {
                  x: () => -distance(),
                  ease: 'none',
                  scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: () => `+=${distance()}`,
                    pin: true,
                    scrub: 0.65,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                      if (line)
                        line.style.transform = `scaleX(${self.progress})`;
                    },
                  },
                });
              });
            return () => {
              window.removeEventListener('flydeer:overlay', overlay);
              gsap.ticker.remove(tick);
              lenis.destroy();
            };
          },
        );
        const refresh = () => ScrollTrigger.refresh();
        const observer = new ResizeObserver(() =>
          requestAnimationFrame(refresh),
        );
        const footer = document.querySelector('footer');
        if (footer) observer.observe(footer);
        window.addEventListener('load', refresh);
        window.addEventListener('flydeer:layout', refresh);
        void document.fonts.ready.then(() => {
          if (!disposed) refresh();
        });
        refresh();
        cleanup = () => {
          observer.disconnect();
          window.removeEventListener('load', refresh);
          window.removeEventListener('flydeer:layout', refresh);
          media.revert();
        };
      })
      .catch(() => {
        cleanup();
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [path]);
  return null;
}
