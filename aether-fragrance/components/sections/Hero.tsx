'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';
import { scroll } from '@/lib/scroll';
import { useAether } from '@/lib/store';
import { FRAGRANCES } from '@/lib/fragrances';
import MagneticButton from '@/components/ui/MagneticButton';

const CAPTIONS = [
  { kicker: 'I — Öffnen', text: 'Erst wendet er sich dir zu.', at: [0.1, 0.17, 0.29, 0.34] },
  { kicker: 'II — Zerlegen', text: 'Dann gibt das Glas nach, Schicht um Schicht.', at: [0.37, 0.44, 0.55, 0.6] },
  { kicker: 'III — Eintreten', text: 'Und dahinter: ein ganzer Himmel.', at: [0.63, 0.7, 0.86, 0.91] },
];

function Switcher() {
  const active = useAether((s) => s.active);
  const setActive = useAether((s) => s.setActive);
  const setHovered = useAether((s) => s.setHovered);

  return (
    <div className="flex items-stretch gap-1 rounded-full border border-gold/15 bg-ink/35 p-1.5 backdrop-blur-md sm:gap-2">
      {FRAGRANCES.map((f, i) => (
        <div key={f.id} className="relative">
          {active === i && (
            <motion.span
              layoutId="switch-indicator"
              className="absolute inset-0 rounded-full border border-gold/50 bg-gold/[0.08] shadow-[0_0_40px_-10px_rgba(201,168,124,0.6)]"
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            />
          )}
          <MagneticButton
            variant="ghost"
            strength={0.25}
            className="h-14 px-4 sm:h-16 sm:px-7"
            onClick={() => setActive(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            ariaLabel={`${f.no} ${f.name} wählen`}
            cursorLabel={f.name}
          >
            <span className="flex flex-col items-start leading-none">
              <span className={`font-mono text-[9px] tracking-[0.25em] transition-colors duration-500 ${active === i ? 'text-gold' : 'text-mist'}`}>
                {f.no.toUpperCase()}
              </span>
              <span
                className={`display mt-1.5 text-[17px] italic transition-[color,letter-spacing] duration-700 sm:text-[21px] ${
                  active === i ? 'text-bone' : 'text-bone/45'
                }`}
              >
                {f.name}
              </span>
            </span>
          </MagneticButton>
        </div>
      ))}
    </div>
  );
}

function PlaceTag() {
  const active = useAether((s) => s.active);
  const f = FRAGRANCES[active];
  return (
    <div className="relative h-[60px] w-[240px] overflow-hidden text-right">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={f.id}
          initial={{ y: 40, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -40, opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <p className="label text-gold">
            {f.time} — {f.place}
          </p>
          <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-mist">{f.coords}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Tagline() {
  const active = useAether((s) => s.active);
  const f = FRAGRANCES[active];
  return (
    <div className="relative h-6 w-full overflow-hidden text-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={f.id}
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="display absolute inset-x-0 text-[15px] italic text-bone/70"
        >
          {f.tagline}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const loaded = useAether((s) => s.loaded);

  // scroll story
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          scroll.hero = self.progress;
        },
      });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 1 },
      });
      const at = (p: number) => p * 10; // timeline length 10 = full hero

      tl.to(q('.hl-line'), { yPercent: -60, opacity: 0, filter: 'blur(10px)', stagger: 0.25, ease: 'power2.in', duration: 1 }, at(0.02))
        .to(q('.hero-meta'), { y: -40, opacity: 0, duration: 0.8 }, at(0.02))
        .to(q('.hero-switch'), { y: 60, opacity: 0, scale: 0.94, duration: 0.9, ease: 'power2.in' }, at(0.05))
        .set(q('.hero-switch'), { pointerEvents: 'none' }, at(0.14))
        .to(q('.hero-cue'), { opacity: 0, duration: 0.5 }, at(0.02))
        .fromTo(q('.rail-fill'), { scaleY: 0 }, { scaleY: 1, duration: 10 }, 0)
        // cinematic letterbox during the dive
        .fromTo(q('.lb'), { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: 'power2.inOut' }, at(0.58))
        .to(q('.lb'), { scaleY: 0, duration: 0.8, ease: 'power2.inOut' }, at(0.92))
        // the flash as we break through the glass
        .fromTo(q('.hero-flash'), { opacity: 0 }, { opacity: 0.55, duration: 0.25, ease: 'power2.in' }, at(0.915))
        .to(q('.hero-flash'), { opacity: 0, duration: 0.5, ease: 'power2.out' }, at(0.94));

      q('.caption').forEach((el: HTMLElement, i: number) => {
        const c = CAPTIONS[i];
        const split = SplitText.create(el.querySelector('.caption-text'), { type: 'words,chars', charsClass: 'char', wordsClass: 'word' });
        const kicker = el.querySelector('.caption-kicker');
        const line = el.querySelector('.caption-line');
        tl.fromTo(
          split.chars,
          { yPercent: 110, rotateX: -80, opacity: 0 },
          { yPercent: 0, rotateX: 0, opacity: 1, stagger: 0.012, duration: at(c.at[1] - c.at[0]), ease: 'back.out(2)' },
          at(c.at[0]),
        )
          .fromTo(kicker, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, at(c.at[0]))
          .fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.out' }, at(c.at[0]))
          .to(split.chars, { yPercent: -110, opacity: 0, filter: 'blur(6px)', stagger: 0.008, duration: at(c.at[3] - c.at[2]), ease: 'power2.in' }, at(c.at[2]))
          .to([kicker, line], { opacity: 0, x: 40, duration: 0.4 }, at(c.at[2]));
      });

      // rail markers light up
      q('.rail-mark').forEach((el: HTMLElement, i: number) => {
        tl.fromTo(el, { color: 'rgba(139,133,123,0.6)' }, { color: '#C9A87C', duration: 0.3 }, at(CAPTIONS[i].at[0]));
      });
    },
    { scope: root },
  );

  // intro once the preloader is gone
  useEffect(() => {
    if (!loaded || !root.current) return;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      const split = SplitText.create(q('.hl-text'), { type: 'words,chars', charsClass: 'char', wordsClass: 'word', mask: 'words' });
      gsap.fromTo(
        split.chars,
        { yPercent: 120, rotate: 8, opacity: 0 },
        { yPercent: 0, rotate: 0, opacity: 1, duration: 1.6, stagger: 0.028, ease: 'expo.out', delay: 1.1 },
      );
      gsap.fromTo(q('.hero-meta-in'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, stagger: 0.12, delay: 1.4 });
      gsap.fromTo(q('.hero-switch-in'), { y: 50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 1.6, ease: 'back.out(1.6)', delay: 1.7 });
      gsap.fromTo(q('.hero-cue-in'), { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 2.2 });
    }, root);
    return () => ctx.revert();
  }, [loaded]);

  return (
    <section ref={root} id="hero" className="relative h-[460vh]" aria-label="Aether — Hero">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* letterbox */}
        <div className="lb pointer-events-none absolute inset-x-0 top-0 z-30 h-[11vh] origin-top bg-ink" style={{ transform: "scaleY(0)" }} />
        <div className="lb pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[11vh] origin-bottom bg-ink" style={{ transform: "scaleY(0)" }} />
        <div className="hero-flash pointer-events-none absolute inset-0 z-20 bg-gold-soft opacity-0 mix-blend-screen" />

        {/* meta */}
        <div className="hero-meta absolute left-5 top-[15vh] z-10 sm:left-[4vw] sm:top-[17vh]">
          <p className="hero-meta-in label text-gold/80 opacity-0">Maison Aether — Paris · Grasse</p>
          <p className="hero-meta-in label mt-3 hidden text-mist opacity-0 sm:block">Collection Céleste · MMXXVI</p>
        </div>
        <div className="hero-meta absolute right-5 top-[15vh] z-10 hidden sm:right-[4vw] sm:top-[17vh] sm:block">
          <div className="hero-meta-in opacity-0">
            <PlaceTag />
          </div>
        </div>

        {/* headline */}
        <h1 className="absolute bottom-[21vh] left-5 z-10 max-w-[92vw] sm:bottom-[24vh] sm:left-[4vw] sm:max-w-[36vw]">
          <span className="hl-line block">
            <span className="hl-text display block text-[12vw] text-bone sm:text-[4.9vw]">Drei Himmel,</span>
          </span>
          <span className="hl-line block">
            <span className="hl-text display block pl-[9vw] text-[12vw] italic text-gold sm:pl-[3.2vw] sm:text-[4.9vw]">in Glas gefangen.</span>
          </span>
        </h1>

        {/* switcher */}
        <div className="hero-switch absolute inset-x-0 bottom-[5vh] z-20 flex flex-col items-center gap-4 sm:bottom-[6vh]">
          <div className="hero-switch-in flex flex-col items-center gap-4 opacity-0">
            <Tagline />
            <Switcher />
          </div>
        </div>

        {/* scroll cue */}
        <div className="hero-cue absolute bottom-[6vh] right-[4vw] z-10 hidden items-end gap-4 lg:flex">
          <div className="hero-cue-in flex items-end gap-4 opacity-0">
            <p className="label text-right leading-5 text-mist">
              Scrollen,
              <br />
              um zu öffnen
            </p>
            <div className="h-16 w-px overflow-hidden bg-gold/15">
              <div className="scroll-cue-line h-full w-full bg-gold" />
            </div>
          </div>
        </div>

        {/* progress rail */}
        <div className="absolute right-4 top-1/2 z-10 hidden h-[34vh] -translate-y-1/2 items-stretch gap-3 sm:flex sm:right-[2vw]">
          <div className="flex flex-col justify-between py-1 text-right">
            {['I', 'II', 'III'].map((r) => (
              <span key={r} className="rail-mark display text-[13px] italic text-mist/60">
                {r}
              </span>
            ))}
          </div>
          <div className="relative w-px bg-bone/10">
            <div className="rail-fill absolute inset-0 origin-top bg-gold" style={{ transform: "scaleY(0)" }} />
          </div>
        </div>

        {/* captions */}
        {CAPTIONS.map((c, i) => (
          <div key={i} className="caption pointer-events-none absolute inset-x-0 bottom-[19vh] z-20 flex flex-col items-center px-6 text-center">
            <div className="mb-4 flex items-center gap-4">
              <span className="caption-line block h-px w-10 origin-right bg-gold/70" style={{ transform: "scaleX(0)" }} />
              <span className="caption-kicker label text-gold opacity-0">{c.kicker}</span>
            </div>
            <p className="caption-text display text-[8.5vw] italic leading-[1.02] text-bone [perspective:600px] sm:text-[3.6vw]">{c.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
