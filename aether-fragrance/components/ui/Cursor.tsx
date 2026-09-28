'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';

/** Gold dot + lagging ring. Grows over interactive elements and can carry a label. */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setEnabled(true);
    document.documentElement.classList.add('has-cursor');
    return () => document.documentElement.classList.remove('has-cursor');
  }, []);

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return;
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3.out' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3.out' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.6, ease: 'power3.out' });
    let state = '';
    let current: string | null = null;

    const apply = (next: string, text: string | null) => {
      if (next === state && text === current) return;
      state = next;
      current = text;
      setLabel(text);
      const big = next === 'link' || next === 'bottle' || next === 'card';
      gsap.to(ring.current, {
        scale: next === 'bottle' ? 2.6 : text ? 2.3 : big ? 1.7 : 1,
        backgroundColor: big ? 'rgba(201,168,124,0.12)' : 'rgba(201,168,124,0)',
        borderColor: big ? 'rgba(201,168,124,0.9)' : 'rgba(201,168,124,0.55)',
        duration: 0.6,
        ease: 'expo.out',
      });
      gsap.to(dot.current, { scale: big ? 0 : 1, duration: 0.4, ease: 'expo.out' });
    };

    let shown = false;
    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY });
        gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.6 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      const target = (e.target as HTMLElement | null)?.closest?.('[data-cursor]') as HTMLElement | null;
      const bottle = document.documentElement.dataset.cursor === 'bottle';
      if (target) apply(target.dataset.cursor ?? 'link', target.dataset.cursorLabel ?? null);
      else if (bottle) apply('bottle', 'Aether');
      else apply('', null);
    };
    const down = () => gsap.to(ring.current, { scale: '-=0.3', duration: 0.2 });
    const up = () => gsap.to(ring.current, { scale: '+=0.3', duration: 0.4, ease: 'elastic.out(1,0.4)' });
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[100] -ml-5 -mt-5 flex h-10 w-10 opacity-0 items-center justify-center rounded-full border border-gold/55 mix-blend-difference will-change-transform"
        aria-hidden
      >
        {label && <span className="font-mono text-[5px] uppercase tracking-[0.25em] text-gold-soft">{label}</span>}
      </div>
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[100] -ml-[3px] -mt-[3px] h-[6px] w-[6px] opacity-0 rounded-full bg-gold will-change-transform"
        aria-hidden
      />
    </>
  );
}
