'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';
import { scroll } from '@/lib/scroll';
import { useAether } from '@/lib/store';
import type { Fragrance } from '@/lib/fragrances';
import { scrollToTarget } from '@/components/providers/SmoothScroll';
import MagneticButton from '@/components/ui/MagneticButton';

const LEVELS = [
  { key: 'top', label: 'Kopf' },
  { key: 'heart', label: 'Herz' },
  { key: 'base', label: 'Basis' },
] as const;

export default function WorldChapter({ f }: { f: Fragrance }) {
  const root = useRef<HTMLElement>(null);
  const i = f.index;
  const long = f.name.length > 7;

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);

      // 3D: dissolve while sliding in, camera path while pinned
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const vh = window.innerHeight;
          const y = self.scroll() - self.start;
          scroll.enter[i] = Math.min(1, Math.max(0, y / vh));
          scroll.local[i] = Math.min(1, Math.max(0, (y - vh) / Math.max(1, self.end - self.start - vh)));
        },
        onLeaveBack: () => {
          scroll.enter[i] = 0;
          scroll.local[i] = 0;
        },
      });

      const name = SplitText.create(q('.w-name'), { type: 'chars', charsClass: 'char' });
      const label = SplitText.create(q('.w-label'), { type: 'chars', charsClass: 'char' });
      const sub = SplitText.create(q('.w-sub'), { type: 'words', wordsClass: 'word' });
      const poem = SplitText.create(q('.w-poem'), { type: 'lines', linesClass: 'line', mask: 'lines' });

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        scrollTrigger: { trigger: el, start: 'top 40%', end: 'bottom bottom', scrub: 1 },
      });

      tl.fromTo(q('.w-scrim'), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power1.out' }, 0)
        .fromTo(q('.w-marquee-wrap'), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power1.out' }, 0)
        .fromTo(label.chars, { x: -30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.015, duration: 1 }, 0)
        .fromTo(q('.w-num'), { scale: 1.6, opacity: 0, rotate: -12, yPercent: 20 }, { scale: 1, opacity: 1, rotate: 0, yPercent: 0, duration: 2.2 }, 0)
        .fromTo(q('.w-no'), { x: -90, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'back.out(2)' }, 0.2)
        .fromTo(
          name.chars,
          { yPercent: 120, rotateX: -100, rotate: 12, opacity: 0 },
          { yPercent: 0, rotateX: 0, rotate: 0, opacity: 1, stagger: 0.07, duration: 1.4, ease: 'back.out(1.8)' },
          0.3,
        )
        .fromTo(sub.words, { x: 140, opacity: 0, rotate: 4 }, { x: 0, opacity: 1, rotate: 0, stagger: 0.06, duration: 1.1, ease: 'back.out(1.6)' }, 0.9)
        .fromTo(poem.lines, { yPercent: 105 }, { yPercent: 0, stagger: 0.1, duration: 1 }, 1.2)
        .fromTo(q('.w-row-0'), { x: -260, rotate: -6, opacity: 0 }, { x: 0, rotate: 0, opacity: 1, duration: 1.1, ease: 'back.out(2)' }, 1.5)
        .fromTo(q('.w-row-1'), { x: 260, rotate: 6, opacity: 0 }, { x: 0, rotate: 0, opacity: 1, duration: 1.1, ease: 'back.out(2)' }, 1.62)
        .fromTo(q('.w-row-2'), { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'back.out(2)' }, 1.74)
        .fromTo(q('.w-cta'), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'back.out(2.4)' }, 1.9)
        .fromTo(q('.w-coords'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1 }, 2)
        // hold — slow drift, like a camera settling
        .to(q('.w-name-wrap'), { xPercent: -6, scale: 1.04, duration: 4, ease: 'none' }, 2.6)
        .to(q('.w-num'), { rotate: 6, yPercent: -10, duration: 4, ease: 'none' }, 2.6)
        .to(q('.w-rows'), { y: -30, duration: 4, ease: 'none' }, 2.6)
        // exit
        .to(name.chars, { yPercent: -130, rotateX: 90, opacity: 0, stagger: { each: 0.05, from: 'center' }, duration: 1.2, ease: 'power3.in' }, 6.5)
        .to([q('.w-sub'), q('.w-poem'), q('.w-no')], { y: -60, opacity: 0, filter: 'blur(8px)', duration: 1, ease: 'power2.in', stagger: 0.05 }, 6.5)
        .to(q('.w-row-0'), { x: -200, opacity: 0, duration: 1, ease: 'power2.in' }, 6.6)
        .to(q('.w-row-1'), { x: 200, opacity: 0, duration: 1, ease: 'power2.in' }, 6.65)
        .to(q('.w-row-2'), { y: 80, opacity: 0, duration: 1, ease: 'power2.in' }, 6.7)
        .to([q('.w-cta'), q('.w-coords'), label.chars], { opacity: 0, duration: 0.8 }, 6.7)
        .to(q('.w-num'), { scale: 0.7, opacity: 0, rotate: 18, duration: 1.4, ease: 'power2.in' }, 6.6)
        .to([q('.w-scrim'), q('.w-marquee-wrap')], { opacity: 0, duration: 1.3, ease: 'power1.in' }, 6.7);

      // multi-layer parallax across the whole chapter
      const layers: [string, number][] = [
        ['.px-back', 14],
        ['.px-mid', 6],
        ['.px-front', -8],
      ];
      layers.forEach(([sel, amt]) => {
        gsap.fromTo(q(sel), { yPercent: amt }, { yPercent: -amt, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.fromTo(q('.w-marquee'), { xPercent: 0 }, { xPercent: -50, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
    },
    { scope: root },
  );

  const discover = () => {
    useAether.getState().setActive(i);
    scrollToTarget('#notes', { duration: 2.8 });
  };

  const marquee = `${f.name} — ${f.subtitle} — ${f.coords} — `;

  return (
    <article ref={root} className="relative h-[320vh]" aria-label={`${f.no} ${f.name}`}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* scrims keep the type legible over bright skies */}
        <div className="w-scrim pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/25 to-transparent" />
        <div className="w-scrim pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />

        {/* back layer — outlined numeral */}
        <div className="px-back pointer-events-none absolute -right-[6vw] top-1/2 -translate-y-1/2 sm:-right-[2vw]">
          <span className="w-num display text-outline block text-[62vw] leading-none sm:text-[40vw]" style={{ letterSpacing: '-0.06em' }}>
            0{i + 1}
          </span>
        </div>

        {/* marquee band */}
        <div className="w-marquee-wrap px-front pointer-events-none absolute bottom-[4vh] left-0 w-max whitespace-nowrap">
          <p className="w-marquee display text-outline-bone text-[11vw] italic leading-none sm:text-[7vw]">
            {marquee.repeat(4)}
          </p>
        </div>

        {/* content */}
        <div className="relative flex h-full flex-col justify-center px-5 pt-20 sm:px-[4vw]">
          <p className="w-label label mb-6 text-gold/80 sm:mb-8">
            Welt {f.roman} — {f.place} · {f.time}
          </p>

          <div className="px-mid">
            <p className="w-no mb-2 font-mono text-xs tracking-[0.3em] text-gold">{f.no.toUpperCase()}</p>
            <div className="w-name-wrap origin-left [perspective:900px]">
              <h2
                className={`w-name display text-bone ${long ? 'text-[16vw] sm:text-[11.5vw]' : 'text-[19vw] sm:text-[15vw]'}`}
                style={{ lineHeight: 0.82 }}
              >
                {f.name}
              </h2>
            </div>
            <p className="w-sub display mt-4 text-[6.4vw] italic text-gold-soft sm:mt-6 sm:text-[2.4vw]">{f.subtitle}</p>
          </div>

          <div className="mt-6 grid gap-8 sm:mt-10 sm:grid-cols-[minmax(0,34ch)_minmax(0,1fr)] sm:gap-[5vw]">
            <p className="w-poem max-w-[36ch] text-[14px] leading-[1.75] text-bone/80 sm:text-[16px]">{f.poem}</p>
            <div className="w-rows hidden flex-col gap-3 sm:flex">
              {LEVELS.map((lv, r) => (
                <div key={lv.key} className={`w-row-${r} flex items-baseline gap-5 border-b border-bone/10 pb-3`}>
                  <span className="label w-14 shrink-0 text-gold/70">{lv.label}</span>
                  <span className="display text-[20px] text-bone/90">{f.notes[lv.key].map((n) => n.name).join(' · ')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-cta mt-8 flex flex-wrap items-center gap-5 sm:mt-10">
            <MagneticButton className="h-14 px-8 text-[12px] uppercase tracking-[0.18em]" onClick={discover} cursorLabel="Entdecken">
              Duft entdecken <span aria-hidden>→</span>
            </MagneticButton>
            <p className="label text-mist">
              Eau de Parfum · 100 ml · <span className="text-bone">{f.price}</span>
            </p>
          </div>
        </div>

        <p className="w-coords label absolute bottom-[4vh] right-5 hidden text-mist sm:block sm:right-[4vw]">
          {f.coords} · {f.batch}
        </p>
      </div>
    </article>
  );
}
