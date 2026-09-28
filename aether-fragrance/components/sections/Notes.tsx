'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';
import { scroll } from '@/lib/scroll';
import { useAether } from '@/lib/store';
import { FRAGRANCES, type Note } from '@/lib/fragrances';
import NoteMotif from '@/components/ui/NoteMotif';
import MagneticButton from '@/components/ui/MagneticButton';

const LEVELS = [
  { key: 'top', name: 'Kopf', time: '0 — 15 min', line: 'Der erste Eindruck. Flüchtig, hell, elektrisch — verflogen, bevor man ihn benennen kann.' },
  { key: 'heart', name: 'Herz', time: '15 min — 4 h', line: 'Was bleibt, wenn der Lärm sich legt. Die eigentliche Stimme des Duftes.' },
  { key: 'base', name: 'Basis', time: '4 h — 24 h', line: 'Das Echo auf der Haut. Warm, schwer, beinahe eine Erinnerung.' },
] as const;

const ease = [0.16, 1, 0.3, 1] as const;

function Swap({ k, children, className = '' }: { k: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={k}
          className="block"
          initial={{ y: '105%', rotate: 3 }}
          animate={{ y: '0%', rotate: 0 }}
          exit={{ y: '-105%', rotate: -3 }}
          transition={{ duration: 0.9, ease }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Card({ note, level, j, k, fid }: { note: Note; level: string; j: number; k: number; fid: string }) {
  const setNoteColor = useAether((s) => s.setNoteColor);
  const key = `${fid}-${k}`;
  const hover = {
    onMouseEnter: () => setNoteColor(note.color),
    onMouseLeave: () => setNoteColor(null),
    'data-cursor': 'card',
    'data-cursor-label': note.name.split(' ')[0],
  };

  if (j === 0) {
    // tall specimen card
    return (
      <div {...hover} className="note-card group relative flex h-[64vh] w-[74vw] shrink-0 flex-col justify-between border border-gold/15 bg-ink/40 p-6 backdrop-blur-sm transition-colors duration-700 hover:border-gold/50 sm:w-[min(28vw,440px)] sm:p-8">
        <div className="flex items-start justify-between">
          <span className="label text-gold/70">{level}note · 0{k + 1}</span>
          <span className="font-mono text-[11px] text-mist">
            <Swap k={key}>{note.share}%</Swap>
          </span>
        </div>
        <div className="note-motif relative mx-auto aspect-square w-[78%] transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-110 group-hover:rotate-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={key} className="absolute inset-0" initial={{ opacity: 0, scale: 0.7, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.2 }} transition={{ duration: 0.8, ease }}>
              <NoteMotif motif={note.motif} color={note.color} seed={k + 1} />
            </motion.div>
          </AnimatePresence>
        </div>
        <div>
          <h3 className="display text-[10vw] leading-[0.95] text-bone sm:text-[3.4vw]">
            <Swap k={key}>{note.name}</Swap>
          </h3>
          <p className="mt-3 flex justify-between gap-4 font-mono text-[11px] tracking-[0.12em] text-mist">
            <Swap k={key} className="italic">{note.latin}</Swap>
            <Swap k={key}>{note.origin}</Swap>
          </p>
        </div>
      </div>
    );
  }

  if (j === 1) {
    // orb — motif in a circle, name overlapping
    return (
      <div {...hover} className="note-card group relative flex w-[80vw] shrink-0 translate-y-[7vh] flex-col items-center sm:w-[min(34vw,520px)]">
        <div className="note-motif relative aspect-square w-full overflow-hidden rounded-full border border-gold/20 bg-[radial-gradient(circle_at_35%_30%,rgba(201,168,124,0.14),rgba(10,10,10,0.3)_70%)] p-[12%] transition-[border-color,transform] duration-[1.2s] ease-[var(--ease-expo)] group-hover:scale-[1.04] group-hover:border-gold/60">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={key} className="absolute inset-[12%]" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.9, ease }}>
              <NoteMotif motif={note.motif} color={note.color} seed={k + 1} />
            </motion.div>
          </AnimatePresence>
        </div>
        <h3 className="display -mt-[5vw] text-center text-[13vw] italic leading-[0.9] text-bone mix-blend-difference sm:-mt-[3.2vw] sm:text-[4.6vw]">
          <Swap k={key}>{note.name}</Swap>
        </h3>
        <p className="label mt-4 text-center text-mist">
          <Swap k={key}>
            {note.latin} — {note.origin}
          </Swap>
        </p>
      </div>
    );
  }

  // typographic card — share as a monumental number
  return (
    <div {...hover} className="note-card group relative flex h-[56vh] w-[70vw] shrink-0 -translate-y-[6vh] gap-6 border-l border-gold/30 pl-6 sm:w-[min(24vw,380px)] sm:pl-8">
      <div className="flex flex-1 flex-col justify-between">
        <span className="label text-gold/70">{level}note · 0{k + 1}</span>
        <div>
          <p className="display text-[26vw] leading-[0.8] text-gold transition-transform duration-[1.2s] ease-[var(--ease-expo)] group-hover:-translate-y-2 sm:text-[9vw]">
            <Swap k={key}>
              {note.share}
              <span className="text-[0.35em] align-top">%</span>
            </Swap>
          </p>
          <p className="label mt-2 text-mist">des Konzentrats</p>
        </div>
        <div>
          <h3 className="display text-[9vw] leading-[0.95] text-bone sm:text-[2.6vw]">
            <Swap k={key}>{note.name}</Swap>
          </h3>
          <p className="mt-2 font-mono text-[11px] italic tracking-[0.12em] text-mist">
            <Swap k={key}>
              {note.latin} · {note.origin}
            </Swap>
          </p>
        </div>
      </div>
      <div className="note-motif relative w-16 shrink-0 opacity-70 transition-opacity duration-700 group-hover:opacity-100 sm:w-20">
        <NoteMotif motif={note.motif} color={note.color} seed={k + 11} />
      </div>
    </div>
  );
}

export default function Notes() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const active = useAether((s) => s.active);
  const setActive = useAether((s) => s.setActive);
  const f = FRAGRANCES[active];

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);

      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'top top',
        onUpdate: (self) => {
          scroll.notesEnter = self.progress;
        },
        onLeaveBack: () => {
          scroll.notesEnter = 0;
        },
      });

      const distance = () => track.current!.scrollWidth - window.innerWidth;
      const horizontal = gsap.to(track.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            scroll.notes = self.progress;
            const bar = el.querySelector<HTMLElement>('.notes-progress');
            if (bar) bar.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      // title reveal and fade as the track takes over
      const title = SplitText.create(q('.n-title'), { type: 'words,chars', charsClass: 'char', wordsClass: 'word', mask: 'words' });
      gsap.fromTo(
        title.chars,
        { yPercent: 115, rotate: 10 },
        { yPercent: 0, rotate: 0, stagger: 0.025, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: el, start: 'top 55%', toggleActions: 'play none none reverse' } },
      );
      gsap.fromTo(q('.n-head-fade'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.1, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 45%', toggleActions: 'play none none reverse' } });
      gsap.to(q('.n-head'), {
        opacity: 0,
        x: -120,
        filter: 'blur(6px)',
        ease: 'power1.in',
        scrollTrigger: { trigger: el, start: 'top top', end: '9% top', scrub: true },
      });

      // each card flies in with overshoot as it enters from the right
      q('.n-item').forEach((item: HTMLElement, idx: number) => {
        const dir = idx % 2 ? 1 : -1;
        gsap.fromTo(
          item,
          { y: dir * 160, rotate: dir * 9, scale: 0.8, opacity: 0 },
          {
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1,
            ease: 'back.out(1.7)',
            scrollTrigger: { trigger: item, containerAnimation: horizontal, start: 'left 95%', end: 'left 50%', scrub: 1 },
          },
        );
        const motif = item.querySelector('.note-motif');
        if (motif) {
          gsap.fromTo(
            motif,
            { xPercent: 18, rotate: -12 },
            { xPercent: -18, rotate: 12, ease: 'none', scrollTrigger: { trigger: item, containerAnimation: horizontal, start: 'left right', end: 'right left', scrub: true } },
          );
        }
      });

      q('.n-level').forEach((lv: HTMLElement) => {
        const big = lv.querySelector('.n-level-big');
        gsap.fromTo(
          big,
          { xPercent: 40, opacity: 0, skewX: -12 },
          { xPercent: 0, opacity: 1, skewX: 0, ease: 'expo.out', scrollTrigger: { trigger: lv, containerAnimation: horizontal, start: 'left 90%', end: 'left 30%', scrub: 1 } },
        );
      });
    },
    { scope: root },
  );

  let k = -1;

  return (
    <section ref={root} id="notes" className="relative h-[600vh]" aria-label="Noten und Inhaltsstoffe">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="n-head absolute left-5 top-[16vh] z-0 max-w-[88vw] sm:left-[4vw] sm:top-[18vh] sm:max-w-[40vw]">
          <p className="n-head-fade label mb-6 text-gold">Kapitel III — Anatomie</p>
          <h2 className="n-title display text-[15vw] text-bone sm:text-[6.6vw]">
            Die Anatomie <em className="text-gold">eines Duftes</em>
          </h2>
          <p className="n-head-fade mt-6 max-w-[40ch] text-[14px] leading-[1.8] text-bone/70 sm:text-[15px]">
            Neun Stoffe, drei Zeiten. Fahren Sie mit dem Cursor über eine Note — die Essenz nimmt ihre Farbe an.
          </p>
          <div className="n-head-fade mt-8 flex flex-wrap gap-2">
            {FRAGRANCES.map((fr, i) => (
              <button
                key={fr.id}
                onClick={() => setActive(i)}
                data-cursor="link"
                className={`relative rounded-full border px-4 py-2 text-[12px] tracking-[0.1em] transition-colors duration-500 ${
                  active === i ? 'border-gold text-ink' : 'border-bone/15 text-bone/70 hover:border-gold/60'
                }`}
              >
                {active === i && (
                  <motion.span layoutId="notes-tab" className="absolute inset-0 -z-10 rounded-full bg-gold" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
                {fr.no} {fr.name}
              </button>
            ))}
          </div>
        </div>

        <div ref={track} className="relative z-10 flex h-full w-max items-center gap-[10vw] pl-[100vw] pr-[18vw] will-change-transform sm:gap-[6vw] sm:pl-[62vw]">
          {LEVELS.map((lv) => (
            <div key={lv.key} className="flex items-center gap-[10vw] sm:gap-[6vw]">
              <div className="n-level flex w-[76vw] shrink-0 flex-col justify-center sm:w-[30vw]">
                <p className="label text-gold/70">{lv.time}</p>
                <p className="n-level-big display text-outline mt-2 text-[34vw] leading-[0.8] sm:text-[15vw]">{lv.name}</p>
                <p className="mt-6 max-w-[30ch] text-[14px] leading-[1.8] text-bone/70">{lv.line}</p>
              </div>
              {f.notes[lv.key].map((note, j) => {
                k += 1;
                return (
                  <div key={j} className="n-item will-change-transform">
                    <Card note={note} level={lv.name} j={j} k={k} fid={f.id} />
                  </div>
                );
              })}
            </div>
          ))}
          <div className="n-item flex w-[80vw] shrink-0 flex-col items-start justify-center sm:w-[34vw]">
            <p className="label text-gold">{f.no} — {f.name}</p>
            <p className="display mt-4 text-[12vw] italic leading-[0.95] text-bone sm:text-[4.4vw]">{f.tagline}</p>
            <MagneticButton className="mt-10 h-14 px-8 text-[12px] uppercase tracking-[0.18em]" href="#footer" cursorLabel="Kaufen">
              100 ml — {f.price}
            </MagneticButton>
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-[5vh] z-10 flex items-center gap-6 sm:inset-x-[4vw]">
          <span className="label text-mist">Kopf</span>
          <div className="relative h-px flex-1 bg-bone/10">
            <div className="notes-progress absolute inset-0 origin-left bg-gold" style={{ transform: 'scaleX(0)' }} />
          </div>
          <span className="label text-mist">Basis</span>
        </div>
      </div>
    </section>
  );
}
