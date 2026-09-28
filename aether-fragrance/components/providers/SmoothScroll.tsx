'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { scroll } from '@/lib/scroll';

export const lenisRef: { current: Lenis | null } = { current: null };

export function scrollToTarget(target: string | number, opts: { duration?: number; offset?: number } = {}) {
  const lenis = lenisRef.current;
  if (lenis) lenis.scrollTo(target, { duration: opts.duration ?? 2.2, offset: opts.offset ?? 0 });
  else if (typeof target === 'string') document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
}

/** Lenis driven by the GSAP ticker, so ScrollTrigger, Lenis and WebGL share one clock. */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({
      lerp: reduced ? 1 : 0.075,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.4,
      smoothWheel: !reduced,
      anchors: true,
    });
    lenisRef.current = lenis;
    lenis.stop();

    lenis.on('scroll', (e: Lenis) => {
      scroll.velocity = e.velocity;
      ScrollTrigger.update();
    });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onPointer = (e: PointerEvent) => {
      scroll.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scroll.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointer);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
