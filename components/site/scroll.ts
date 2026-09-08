/** Let the optional smooth-scroll runtime own programmatic scrolling. */
export function scrollPageTo(top: number) {
  const event = new CustomEvent<number>('flydeer:scroll-to', {
    detail: top,
    cancelable: true,
  });
  if (window.dispatchEvent(event)) {
    window.scrollTo({
      top,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
}
