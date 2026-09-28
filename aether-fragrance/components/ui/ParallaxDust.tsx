'use client';

import { useMemo, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { rng } from '@/lib/noise';

/** Loose gold motes on three depth planes — each plane scrolls at its own speed. */
export default function ParallaxDust({ seed = 1, count = 26, className = '' }: { seed?: number; count?: number; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const motes = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => {
      const depth = Math.floor(r() * 3);
      return {
        x: r() * 100,
        y: r() * 100,
        size: depth === 2 ? 3 + r() * 5 : depth === 1 ? 2 + r() * 2 : 1 + r() * 1.5,
        blur: depth === 2 ? 2 + r() * 3 : 0,
        opacity: depth === 2 ? 0.25 + r() * 0.25 : 0.3 + r() * 0.5,
        speed: depth === 2 ? -1.8 : depth === 1 ? -0.8 : -0.3,
      };
    });
  }, [seed, count]);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>('.mote', root.current).forEach((el) => {
        const speed = Number(el.dataset.speed);
        gsap.fromTo(
          el,
          { y: () => -speed * window.innerHeight * 0.25 },
          {
            y: () => speed * window.innerHeight * 0.25,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {motes.map((m, i) => (
        <span
          key={i}
          className="mote absolute rounded-full bg-gold will-change-transform"
          data-speed={m.speed}
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.size,
            height: m.size,
            opacity: m.opacity,
            filter: m.blur ? `blur(${m.blur}px)` : undefined,
            boxShadow: `0 0 ${m.size * 3}px rgba(201,168,124,0.6)`,
          }}
        />
      ))}
    </div>
  );
}
