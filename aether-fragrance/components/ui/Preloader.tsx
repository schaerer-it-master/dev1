'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useAether } from '@/lib/store';
import { lenisRef } from '@/components/providers/SmoothScroll';
import { ScrollTrigger } from '@/lib/gsap';

/** Counter + wordmark, then the curtain splits to reveal the flacon rising from the dark. */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const setLoaded = useAether((s) => s.setLoaded);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const counter = { v: 0 };
    let ready = false;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    // give the GPU a moment to compile shaders behind the curtain
    const instant = new URLSearchParams(window.location.search).has('instant');
    const minTime = new Promise((r) => setTimeout(r, instant ? 0 : 2200));
    Promise.all([fonts, minTime]).then(() => (ready = true));
    let tick: () => void = () => {};

    const ctx = gsap.context(() => {
      gsap.set(q('.pl-char'), { yPercent: 110 });
      gsap.to(q('.pl-char'), { yPercent: 0, duration: 1.4, stagger: 0.07, ease: 'expo.out', delay: 0.2 });
      gsap.from(q('.pl-meta'), { opacity: 0, y: 12, duration: 1.2, stagger: 0.1, delay: 0.5 });

      tick = () => {
        const target = ready ? 100 : Math.min(counter.v + Math.random() * 3, 92);
        counter.v += (target - counter.v) * (ready ? 0.18 : 0.06);
        const v = Math.round(counter.v);
        if (count.current) count.current.textContent = String(v).padStart(3, '0');
        if (bar.current) bar.current.style.transform = `scaleX(${counter.v / 100})`;
        if (ready && counter.v > 99.4) {
          gsap.ticker.remove(tick);
          exit();
        }
      };
      gsap.ticker.add(tick);

      const exit = () => {
        const tl = gsap.timeline({
          onComplete: () => {
            el.style.display = 'none';
          },
        });
        tl.to(q('.pl-char'), { yPercent: -110, duration: 0.9, stagger: 0.04, ease: 'expo.in' })
          .to(q('.pl-meta'), { opacity: 0, duration: 0.4 }, '<')
          .to(q('.pl-bar'), { scaleX: 0, transformOrigin: 'right', duration: 0.6, ease: 'expo.inOut' }, '<0.2')
          .add(() => {
            document.documentElement.classList.remove('is-loading');
            setLoaded(true);
            lenisRef.current?.start();
            ScrollTrigger.refresh();
          })
          .to(q('.pl-top'), { yPercent: -100, duration: 1.4, ease: 'expo.inOut' }, '-=0.1')
          .to(q('.pl-bottom'), { yPercent: 100, duration: 1.4, ease: 'expo.inOut' }, '<');
      };
    }, el);
    return () => {
      gsap.ticker.remove(tick);
      ctx.revert();
    };
  }, [setLoaded]);

  return (
    <div ref={root} className="fixed inset-0 z-[120]" aria-live="polite" aria-label="Lädt">
      <div className="pl-top absolute inset-x-0 top-0 h-1/2 bg-ink" />
      <div className="pl-bottom absolute inset-x-0 bottom-0 h-1/2 bg-ink" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="pl-meta label mb-8 text-gold/70">Maison Aether — Parfums du Ciel</p>
        <h2 className="display flex overflow-hidden text-[18vw] leading-[0.9] text-bone sm:text-[11vw]" aria-label="Aether">
          {'AETHER'.split('').map((c, i) => (
            <span key={i} className="pl-char inline-block" style={{ letterSpacing: '0.04em' }}>
              {c}
            </span>
          ))}
        </h2>
        <div className="pl-bar mt-10 h-px w-[min(60vw,420px)] bg-gold/20">
          <div ref={bar} className="h-full origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
      <p className="pl-meta label absolute bottom-8 left-6 text-mist sm:left-10">Drei Himmel, in Glas gefangen</p>
      <p className="pl-meta absolute bottom-6 right-6 font-mono text-4xl tabular-nums text-gold sm:right-10">
        <span ref={count}>000</span>
      </p>
    </div>
  );
}
