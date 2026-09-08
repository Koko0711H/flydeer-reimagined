'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useLanguage } from './provider';

export function Film({
  src,
  mobile,
  poster,
  className = '',
  controls = true,
}: {
  src: string;
  mobile?: string;
  poster?: string;
  className?: string;
  controls?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [manual, setManual] = useState<boolean | null>(null);
  const { lang } = useLanguage();
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;
    const sync = () => {
      if (
        inView &&
        (manual === true || (!reduce.matches && manual !== false)) &&
        !document.hidden
      )
        element.play().catch(() => {});
      else element.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 },
    );
    observer.observe(element);
    reduce.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      reduce.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      element.pause();
    };
  }, [manual, src]);
  return (
    <>
      <video
        key={src}
        ref={video}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        className={className}
        aria-hidden="true"
      >
        {mobile ? (
          <source src={mobile} type="video/mp4" media="(max-width:760px)" />
        ) : null}
        <source src={src} type="video/mp4" />
      </video>
      {controls ? (
        <button
          className="film-control icon-button"
          onClick={() => setManual(!playing)}
          aria-label={
            playing
              ? lang === 'zh'
                ? '暂停视频'
                : 'Pause video'
              : lang === 'zh'
                ? '播放视频'
                : 'Play video'
          }
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
      ) : null}
    </>
  );
}
