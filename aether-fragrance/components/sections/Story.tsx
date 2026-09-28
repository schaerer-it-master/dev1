'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';
import { scroll } from '@/lib/scroll';
import { canvasControl } from '@/lib/stage';
import ParallaxDust from '@/components/ui/ParallaxDust';

const MANIFESTO =
  'Für die Alten war Aether die obere Luft — das, was die Götter atmen. Wir haben versucht, sie einzufangen: den Moment vor dem Blitz, das Grün über dem Schnee, das letzte Glühen über dem Meer. Kein Parfum, das man trägt. Ein Wetter, in dem man steht.';
const HIGHLIGHT = new Set(['Aether', 'Götter', 'Blitz,', 'Grün', 'Glühen', 'Wetter,']);

const STEPS = [
  {
    no: 'I',
    title: 'Destillation',
    kicker: 'Grasse · bei Nacht',
    text: 'Wir destillieren nach Einbruch der Dunkelheit, wenn die Blüten am schwersten atmen. Kupferne Alambics, Holzfeuer, Geduld. Aus einer Tonne Iriswurzel werden drei Gramm Butter.',
  },
  {
    no: 'II',
    title: 'Mazeration',
    kicker: '1 412 Stunden · Dunkelheit',
    text: 'Das Konzentrat ruht in Eichenfässern, in völliger Dunkelheit, bei vierzehn Grad. Es wird nicht gerührt, nicht geprüft, nicht gestört — bis es von selbst still wird.',
  },
  {
    no: 'III',
    title: 'Der Flakon',
    kicker: 'Murano · von Hand',
    text: 'Sieben Platten Glas, einzeln geschliffen und verschmolzen, eine Kugel aus Obsidian als Verschluss. Jeder Flakon trägt die Nummer seiner Charge und die Stunde seines Himmels.',
  },
];

const STATS = [
  { value: 7, label: 'Schichten Glas' },
  { value: 1412, label: 'Stunden Mazeration' },
  { value: 3, label: 'Himmel' },
  { value: 24, label: 'Stunden auf der Haut' },
];

function StepArt({ i }: { i: number }) {
  if (i === 0) {
    return (
      <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
        {Array.from({ length: 9 }, (_, k) => (
          <circle key={k} className="art-draw" cx="100" cy={60 + k * 12} r={Math.round((30 + Math.sin(k * 0.8) * 24) * 100) / 100} fill="none" stroke="#C9A87C" strokeOpacity={0.2 + k * 0.08} strokeWidth="0.8" />
        ))}
        <path className="art-draw" d="M100 10 C 120 40, 80 60, 100 90 S 80 140, 100 190" fill="none" stroke="#e4ceaa" strokeWidth="1" />
      </svg>
    );
  }
  if (i === 1) {
    return (
      <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
        {Array.from({ length: 14 }, (_, k) => (
          <rect key={k} className="art-draw" x={20 + k * 3} y={20 + k * 3} width={160 - k * 6} height={160 - k * 6} rx={80 - k * 5.5} fill="none" stroke="#C9A87C" strokeOpacity={0.15 + k * 0.05} strokeWidth="0.7" />
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
      {Array.from({ length: 7 }, (_, k) => (
        <rect key={k} className="art-draw" x="55" y={48 + k * 17} width="90" height="15" rx="4" fill="none" stroke="#C9A87C" strokeOpacity={0.35 + k * 0.08} strokeWidth="0.8" />
      ))}
      <circle className="art-draw" cx="100" cy="30" r="18" fill="none" stroke="#e4ceaa" strokeWidth="1" />
    </svg>
  );
}

export default function Story() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);

      // the story section is opaque — pause WebGL while it covers the canvas
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'max',
        onEnter: () => {
          scroll.canvasVisible = false;
          canvasControl.setFrameloop?.('never');
        },
        onLeaveBack: () => {
          scroll.canvasVisible = true;
          canvasControl.setFrameloop?.('always');
        },
      });

      // manifesto: words ignite with the scroll
      const words = q('.m-word');
      gsap.fromTo(
        words,
        { opacity: 0.08, filter: 'blur(3px)', y: 12 },
        {
          opacity: 1,
          filter: 'blur(0px)',
          y: 0,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: q('.manifesto')[0], start: 'top top', end: 'bottom bottom', scrub: 1 },
        },
      );
      gsap.fromTo(
        q('.m-glyph'),
        { rotate: -30, scale: 0.8 },
        { rotate: 40, scale: 1.25, ease: 'none', scrollTrigger: { trigger: q('.manifesto')[0], start: 'top bottom', end: 'bottom top', scrub: true } },
      );
      gsap.fromTo(q('.m-kicker'), { x: -60, opacity: 0 }, { x: 0, opacity: 1, ease: 'back.out(2)', scrollTrigger: { trigger: q('.manifesto')[0], start: 'top 60%', toggleActions: 'play none none reverse' } });

      // atelier steps fly in from alternating sides
      q('.step').forEach((step: HTMLElement, i: number) => {
        const dir = i % 2 ? 1 : -1;
        const sq = gsap.utils.selector(step);
        const title = SplitText.create(sq('.step-title'), { type: 'chars', charsClass: 'char', mask: 'chars' });
        const tl = gsap.timeline({ scrollTrigger: { trigger: step, start: 'top 72%', toggleActions: 'play none none reverse' } });
        tl.fromTo(sq('.step-no'), { xPercent: dir * -60, opacity: 0, rotate: dir * -8 }, { xPercent: 0, opacity: 1, rotate: 0, duration: 1.6, ease: 'back.out(1.5)' })
          .fromTo(title.chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.035, duration: 1.2, ease: 'expo.out' }, 0.15)
          .fromTo(sq('.step-kicker'), { x: dir * 80, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease: 'back.out(2)' }, 0.25)
          .fromTo(sq('.step-text'), { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 0.35)
          .fromTo(sq('.step-art'), { scale: 0.4, rotate: dir * 45, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.6, ease: 'back.out(1.4)' }, 0.1)
          .fromTo(sq('.art-draw'), { strokeDasharray: 800, strokeDashoffset: 800 }, { strokeDashoffset: 0, duration: 2.4, stagger: 0.05, ease: 'power2.inOut' }, 0.3);
        gsap.fromTo(sq('.step-no'), { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: step, start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo(sq('.step-art'), { yPercent: -15 }, { yPercent: 15, ease: 'none', scrollTrigger: { trigger: step, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      // a thread of gold drawn through the atelier
      gsap.fromTo(
        q('.thread-path'),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: q('.atelier')[0], start: 'top 60%', end: 'bottom 60%', scrub: 1 } },
      );

      // counters
      q('.stat').forEach((s: HTMLElement) => {
        const num = s.querySelector<HTMLElement>('.stat-num')!;
        const target = Number(num.dataset.value);
        const obj = { v: 0 };
        gsap.fromTo(s, { y: 80, opacity: 0, rotate: 3 }, { y: 0, opacity: 1, rotate: 0, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: s, start: 'top 85%', toggleActions: 'play none none reverse' } });
        gsap.to(obj, {
          v: target,
          duration: 2.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: s, start: 'top 85%', toggleActions: 'play none none reverse' },
          onUpdate: () => {
            num.textContent = Math.round(obj.v).toLocaleString('de-DE');
          },
        });
      });

      // the window: a small frame that opens into a full-bleed sky
      const win = q('.window')[0];
      const wtl = gsap.timeline({ scrollTrigger: { trigger: q('.window-wrap')[0], start: 'top top', end: 'bottom bottom', scrub: 1 } });
      wtl.fromTo(win, { clipPath: 'inset(28% 32% 28% 32% round 400px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 5 }, 0)
        .fromTo(q('.w-l1'), { yPercent: 60 }, { yPercent: -60, ease: 'none', duration: 10 }, 0)
        .fromTo(q('.w-l2'), { yPercent: 140 }, { yPercent: -140, ease: 'none', duration: 10 }, 0)
        .fromTo(q('.w-l3'), { yPercent: 260, rotate: -6 }, { yPercent: -260, rotate: 6, ease: 'none', duration: 10 }, 0)
        .fromTo(q('.w-sky'), { scale: 1.5 }, { scale: 1, ease: 'none', duration: 10 }, 0);
      const quote = SplitText.create(q('.w-quote'), { type: 'words,chars', charsClass: 'char', wordsClass: 'word' });
      wtl.fromTo(quote.chars, { opacity: 0, yPercent: 80, rotateY: 90 }, { opacity: 1, yPercent: 0, rotateY: 0, stagger: 0.04, ease: 'back.out(2)', duration: 2 }, 3.5);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="story" className="relative z-10 bg-ink" aria-label="Die Geschichte von Aether">
      {/* manifesto */}
      <div className="manifesto relative h-[260vh]">
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 sm:px-[8vw]">
          <span className="m-glyph display text-outline pointer-events-none absolute -right-[10vw] top-1/2 -translate-y-1/2 text-[70vw] leading-none sm:text-[48vw]" aria-hidden>
            Æ
          </span>
          <ParallaxDust seed={9} count={22} />
          <div className="relative">
            <p className="m-kicker label mb-10 text-gold">Kapitel IV — Manifest</p>
            <p className="display max-w-[22ch] text-[8.2vw] leading-[1.08] text-bone sm:text-[4.3vw]" style={{ letterSpacing: '-0.015em' }}>
              {MANIFESTO.split(' ').map((w, i) => (
                <span key={i} className={`m-word inline-block pr-[0.25em] ${HIGHLIGHT.has(w) ? 'italic text-gold' : ''}`}>
                  {w}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>

      {/* atelier */}
      <div className="atelier relative px-5 py-[16vh] sm:px-[6vw]">
        <svg className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-[40vw] -translate-x-1/2 sm:block" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden>
          <path
            className="thread-path"
            d="M50 0 C 90 120, 10 220, 50 340 S 90 560, 50 680 S 10 880, 50 1000"
            fill="none"
            stroke="#C9A87C"
            strokeOpacity="0.35"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset="1"
          />
        </svg>
        <div className="mb-[12vh] flex items-end justify-between">
          <p className="label text-gold">Kapitel V — Das Atelier</p>
          <p className="label hidden text-mist sm:block">Paris · Grasse · Murano</p>
        </div>
        <div className="flex flex-col gap-[18vh]">
          {STEPS.map((s, i) => (
            <div key={s.no} className={`step relative grid items-center gap-10 sm:grid-cols-2 sm:gap-[6vw] ${i % 2 ? 'sm:[direction:rtl]' : ''}`}>
              <div className="relative [direction:ltr]">
                <span className="step-no display text-outline block text-[42vw] leading-[0.75] sm:text-[20vw]">{s.no}</span>
                <div className="step-art absolute right-0 top-1/2 h-[46vw] w-[46vw] -translate-y-1/2 sm:right-[4vw] sm:h-[16vw] sm:w-[16vw]">
                  <StepArt i={i} />
                </div>
              </div>
              <div className="[direction:ltr]">
                <p className="step-kicker label mb-5 text-gold/80">{s.kicker}</p>
                <h3 className="step-title display text-[14vw] text-bone sm:text-[6vw]">{s.title}</h3>
                <p className="step-text mt-6 max-w-[42ch] text-[15px] leading-[1.85] text-bone/75 sm:text-[17px]">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* numbers */}
      <div className="grid grid-cols-2 gap-y-16 border-y border-gold/10 px-5 py-[14vh] sm:grid-cols-4 sm:px-[6vw]">
        {STATS.map((s) => (
          <div key={s.label} className="stat">
            <p className="display text-[20vw] leading-none text-bone sm:text-[8vw]">
              <span className="stat-num tabular-nums" data-value={s.value}>
                0
              </span>
            </p>
            <p className="label mt-4 text-gold/70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* window */}
      <div className="window-wrap relative h-[260vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div className="window absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(28% 32% 28% 32% round 400px)' }}>
            <div className="w-sky sky-window absolute inset-0" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,rgba(10,10,10,0.6))]" />
            <p className="w-l1 display text-outline-bone pointer-events-none absolute left-[4vw] top-[18%] text-[18vw] italic leading-none" aria-hidden>
              Wetter
            </p>
            <p className="w-l2 label pointer-events-none absolute right-[6vw] top-[40%] text-gold/80" aria-hidden>
              29°34′N · 68°21′N · 37°01′N
            </p>
            <span className="w-l3 pointer-events-none absolute bottom-[20%] left-[20%] h-3 w-3 rounded-full bg-gold shadow-[0_0_30px_8px_rgba(201,168,124,0.5)]" aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center px-6 [perspective:900px]">
              <p className="w-quote display max-w-[16ch] text-center text-[11vw] leading-[1.02] text-bone sm:text-[6vw]">
                Parfum ist Wetter, das man <em className="text-gold">tragen</em> kann.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
