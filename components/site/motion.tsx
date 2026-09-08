'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function MotionSystem() {
  const path = usePathname();
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    let smoothCleanup = () => {};
    let frame = 0;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        cleanup = () => media.revert();
        document.documentElement.dataset.motionStatus = 'ready';
        const instantScroll = (event: Event) => {
          window.scrollTo({
            top: (event as CustomEvent<number>).detail,
            behavior: 'instant',
          });
          ScrollTrigger.update();
        };
        window.addEventListener('flydeer:scroll-immediate', instantScroll);
        media.add(
          '(prefers-reduced-motion: no-preference) and (min-height: 621px)',
          () => {
            const hero = document.querySelector<HTMLElement>('.frs-hero');
            if (hero) {
              const timeline = gsap.timeline({
                scrollTrigger: {
                  trigger: hero,
                  start: 'top top',
                  end: 'bottom 15%',
                  scrub: 0.5,
                },
              });
              timeline
                .to(
                  '.frs-hero-object',
                  { scale: 1.12, yPercent: -10, ease: 'none' },
                  0,
                )
                .to(
                  '.frs-hero-copy',
                  { y: -55, opacity: 0.18, ease: 'none' },
                  0,
                );
            }
            gsap.utils
              .toArray<HTMLElement>('.why-points article')
              .forEach((el) => {
                gsap.from(el, {
                  x: 0,
                  y: 45,
                  rotation: 0,
                  opacity: 0.12,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: el,
                    start: 'top 98%',
                    end: 'top 58%',
                    scrub: 0.5,
                  },
                });
              });
            gsap.utils
              .toArray<HTMLElement>('.why-statement h2 span')
              .forEach((el) => {
                gsap.fromTo(
                  el,
                  { color: '#b6b6bc' },
                  {
                    color: '#c70018',
                    scrollTrigger: {
                      trigger: el,
                      start: 'top 85%',
                      end: 'top 45%',
                      scrub: true,
                    },
                  },
                );
              });
            gsap.utils
              .toArray<HTMLElement>('[data-reveal]')
              .filter(
                (el) =>
                  !el.closest(
                    '.why-points, .case-kinetic, .company-teaser, .contact-band',
                  ),
              )
              .forEach((el) => {
                gsap.from(el, {
                  y: 48,
                  opacity: 0,
                  duration: 0.8,
                  ease: 'power3.out',
                  scrollTrigger: { trigger: el, start: 'top 95%', once: true },
                });
              });
            gsap.utils
              .toArray<HTMLElement>('.industry-image, .about-film')
              .forEach((el) => {
                gsap.fromTo(
                  el,
                  {
                    clipPath: 'inset(14% 17% 14% 17% round 120px)',
                    scale: 0.85,
                    rotate: -3,
                  },
                  {
                    clipPath: 'inset(0% 0% 0% 0% round 26px)',
                    scale: 1,
                    rotate: 0,
                    ease: 'none',
                    scrollTrigger: {
                      trigger: el,
                      start: 'top 90%',
                      end: 'top 25%',
                      scrub: 0.6,
                    },
                  },
                );
              });
            gsap.utils
              .toArray<HTMLElement>('.page-hero h1, .showroom h1')
              .forEach((el) => {
                gsap.from(el, {
                  clipPath: 'inset(100% 0% 0% 0%)',
                  y: 80,
                  duration: 1,
                  ease: 'power4.out',
                });
              });
            gsap.utils
              .toArray<HTMLElement>(
                '.catalog-card, .case-grid .case-slide, .feature-row article',
              )
              .forEach((el, index) => {
                gsap.from(el, {
                  y: 85,
                  rotationX: 14,
                  opacity: 0.15,
                  duration: 0.85,
                  delay: (index % 2) * 0.1,
                  ease: 'power3.out',
                  scrollTrigger: { trigger: el, start: 'top 98%', once: true },
                });
              });
            gsap.utils.toArray<HTMLElement>('.contact-band').forEach((el) => {
              gsap.from(el.querySelector('h2'), {
                x: -95,
                y: 45,
                rotation: -3,
                ease: 'none',
                scrollTrigger: {
                  trigger: el,
                  start: 'top bottom',
                  end: 'top 35%',
                  scrub: 0.55,
                },
              });
              gsap.from(el.querySelector('.contact-band-info'), {
                x: 80,
                opacity: 0.2,
                ease: 'none',
                scrollTrigger: {
                  trigger: el,
                  start: 'top 95%',
                  end: 'top 45%',
                  scrub: 0.55,
                },
              });
            });
            const progress = document.querySelector('.page-scroll-progress');
            if (progress)
              gsap.fromTo(
                progress,
                { scaleX: 0 },
                {
                  scaleX: 1,
                  ease: 'none',
                  scrollTrigger: { start: 0, end: 'max', scrub: true },
                },
              );
            return () => {
              if (hero) delete hero.dataset.kinetic;
            };
          },
        );

        media.add(
          '(prefers-reduced-motion: no-preference) and (min-height: 780px), (prefers-reduced-motion: no-preference) and (min-width: 761px) and (min-height: 621px)',
          () => {
            const company =
              document.querySelector<HTMLElement>('.company-teaser');
            if (company) {
              company.dataset.kinetic = 'true';
              const photos = company.querySelectorAll<HTMLElement>(
                '[data-company-photo]',
              );
              const labels = company.querySelectorAll<HTMLElement>(
                '[data-company-label]',
              );
              const film = gsap.timeline({
                scrollTrigger: {
                  trigger: company,
                  start: 'top 88px',
                  end: () =>
                    '+=' +
                    Math.max(
                      1,
                      company.offsetHeight -
                        (company.querySelector<HTMLElement>('.company-sticky')
                          ?.offsetHeight ?? innerHeight),
                    ),
                  scrub: 0.6,
                  invalidateOnRefresh: true,
                },
              });
              film.to(photos[0], { scale: 1.18, duration: 1, ease: 'none' });
              for (let i = 1; i < photos.length; i++) {
                film
                  .fromTo(
                    photos[i],
                    { clipPath: 'inset(0% 100% 0% 0%)', scale: 1.15 },
                    {
                      clipPath: 'inset(0% 0% 0% 0%)',
                      scale: 1,
                      duration: 1.3,
                      ease: 'none',
                    },
                    i * 1.1,
                  )
                  .to(
                    labels[i - 1],
                    { opacity: 0, y: -18, duration: 0.25 },
                    i * 1.1,
                  )
                  .fromTo(
                    labels[i],
                    { opacity: 0, y: 18 },
                    { opacity: 1, y: 0, duration: 0.4 },
                    i * 1.1 + 0.3,
                  );
              }
            }

            return () => {
              if (company) delete company.dataset.kinetic;
            };
          },
        );

        media.add(
          '(min-width: 1000px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
          () => {
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
                const travel = gsap.to(track, {
                  x: () => -distance(),
                  ease: 'none',
                  scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: () => '+=' + distance(),
                    pin: true,
                    scrub: 0.65,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                      if (line)
                        line.style.transform = 'scaleX(' + self.progress + ')';
                    },
                  },
                });
                section
                  .querySelectorAll<HTMLElement>('.story-image img')
                  .forEach((photo) => {
                    gsap.fromTo(
                      photo,
                      { scale: 1.22, xPercent: -8 },
                      {
                        scale: 1,
                        xPercent: 8,
                        ease: 'none',
                        scrollTrigger: {
                          trigger: photo.parentElement,
                          containerAnimation: travel,
                          start: 'left right',
                          end: 'right left',
                          scrub: true,
                        },
                      },
                    );
                  });
              });
          },
        );
        media.add(
          '(max-width: 999px) and (prefers-reduced-motion: no-preference)',
          () => {
            gsap.utils.toArray<HTMLElement>('.story-image').forEach((image) => {
              gsap.from(image, {
                clipPath: 'inset(0% 80% 0% 0%)',
                x: 45,
                scrollTrigger: {
                  trigger: image,
                  start: 'top 95%',
                  end: 'top 40%',
                  scrub: 0.4,
                },
              });
            });
          },
        );

        // Pointer feedback is delegated so product tabs and filtered cards work after mounting.
        media.add(
          '(pointer: fine) and (prefers-reduced-motion: no-preference)',
          () => {
            let active: HTMLElement | null = null;
            let bounds: DOMRect | null = null;
            const changed = new Set<HTMLElement>();
            const reset = () => {
              if (active)
                gsap.to(active, {
                  x: 0,
                  y: 0,
                  rotateX: 0,
                  rotateY: 0,
                  duration: 0.45,
                  ease: 'power3.out',
                  overwrite: 'auto',
                });
              active = null;
              bounds = null;
            };
            const move = (event: PointerEvent) => {
              const target = (event.target as Element).closest<HTMLElement>(
                '.pill, .header-contact, .catalog-card, .case-grid .case-card',
              );
              if (!target) {
                if (active) reset();
                return;
              }
              if (target !== active) {
                reset();
                active = target;
                bounds = target.getBoundingClientRect();
                changed.add(target);
              }
              if (!bounds) return;
              const x = (event.clientX - bounds.left) / bounds.width - 0.5;
              const y = (event.clientY - bounds.top) / bounds.height - 0.5;
              const card = target.matches('.catalog-card, .case-card');
              gsap.to(
                target,
                card
                  ? {
                      rotateY: x * 12,
                      rotateX: -y * 10,
                      transformPerspective: 900,
                      duration: 0.4,
                      overwrite: 'auto',
                    }
                  : { x: x * 16, y: y * 12, duration: 0.25, overwrite: 'auto' },
              );
            };
            document.addEventListener('pointermove', move, { passive: true });
            document.addEventListener('pointerleave', reset);
            return () => {
              document.removeEventListener('pointermove', move);
              document.removeEventListener('pointerleave', reset);
              changed.forEach((target) => {
                gsap.killTweensOf(target);
                gsap.set(target, { clearProps: 'transform' });
              });
            };
          },
        );

        const refresh = () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            if (!disposed) {
              ScrollTrigger.refresh();
              document.documentElement.dataset.motionTriggers = String(
                ScrollTrigger.getAll().length,
              );
            }
          });
        };
        const observer = new ResizeObserver(refresh);
        const footer = document.querySelector('footer');
        if (footer) observer.observe(footer);
        window.addEventListener('load', refresh);
        window.addEventListener('flydeer:layout', refresh);
        void document.fonts.ready.then(refresh);
        refresh();
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          window.removeEventListener('load', refresh);
          window.removeEventListener('flydeer:layout', refresh);
          window.removeEventListener('flydeer:scroll-immediate', instantScroll);
          media.revert();
          delete document.documentElement.dataset.motionStatus;
          delete document.documentElement.dataset.motionTriggers;
        };

        // Smooth scrolling is optional: a failure here must never disable scene animation.
        void import('lenis')
          .then(({ default: Lenis }) => {
            if (disposed) return;
            const smoothMedia = gsap.matchMedia();
            smoothMedia.add(
              '(min-width: 1000px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
              () => {
                const lenis = new Lenis({
                  lerp: 0.1,
                  syncTouch: false,
                  anchors: { offset: 0 },
                  prevent: (node) => node.hasAttribute('data-lenis-prevent'),
                });
                lenis.on('scroll', () => ScrollTrigger.update());
                const tick = (time: number) => lenis.raf(time * 1000);
                gsap.ticker.add(tick);
                const overlay = (event: Event) => {
                  if ((event as CustomEvent<boolean>).detail) lenis.stop();
                  else lenis.start();
                };
                const seek = (event: Event) => {
                  event.preventDefault();
                  lenis.scrollTo((event as CustomEvent<number>).detail, {
                    immediate: event.type === 'flydeer:scroll-immediate',
                  });
                };
                window.addEventListener('flydeer:overlay', overlay);
                window.addEventListener('flydeer:scroll-to', seek);
                window.addEventListener('flydeer:scroll-immediate', seek);
                return () => {
                  window.removeEventListener('flydeer:overlay', overlay);
                  window.removeEventListener('flydeer:scroll-to', seek);
                  window.removeEventListener('flydeer:scroll-immediate', seek);
                  gsap.ticker.remove(tick);
                  lenis.destroy();
                };
              },
            );
            smoothCleanup = () => smoothMedia.revert();
          })
          .catch((error: unknown) =>
            console.warn('[FRS POWER] Native scrolling retained.', error),
          );
      })
      .catch((error: unknown) => {
        cleanup();
        document.documentElement.dataset.motionStatus = 'fallback';
        console.warn(
          '[FRS POWER] Motion unavailable; static content remains accessible.',
          error,
        );
      });
    return () => {
      disposed = true;
      smoothCleanup();
      cleanup();
    };
  }, [path]);
  return null;
}
