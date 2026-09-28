'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, SplitText, useGSAP } from '@/lib/gsap';
import { FRAGRANCES } from '@/lib/fragrances';
import { BUILD_MINUTES } from '@/lib/config';
import MagneticButton from '@/components/ui/MagneticButton';
import { scrollToTarget } from '@/components/providers/SmoothScroll';

function GrasseClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time || '--:--:--'}</span>;
}

const COLUMNS = [
  { title: 'Maison', links: ['Geschichte', 'Atelier', 'Journal', 'Presse'] },
  { title: 'Service', links: ['Versand', 'Rückgabe', 'Gravur', 'Kontakt'] },
  { title: 'Folgen', links: ['Instagram', 'Pinterest', 'Vimeo'] },
];

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const big = SplitText.create(q('.f-word'), { type: 'chars', charsClass: 'char gold-fill' });
      gsap.fromTo(
        big.chars,
        { yPercent: 100, rotate: (i: number) => (i - 2.5) * 6 },
        {
          yPercent: 0,
          rotate: 0,
          ease: 'back.out(1.4)',
          stagger: 0.06,
          scrollTrigger: { trigger: q('.f-word-wrap')[0], start: 'top bottom', end: 'bottom bottom', scrub: 1 },
        },
      );
      gsap.fromTo(q('.f-inner'), { yPercent: -18 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true } });

      const cta = SplitText.create(q('.f-cta'), { type: 'words,chars', charsClass: 'char', wordsClass: 'word', mask: 'words' });
      gsap.fromTo(cta.chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.02, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: q('.f-cta')[0], start: 'top 80%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(q('.f-set'), { x: (i: number) => (i - 1) * 120, y: 80, rotate: (i: number) => (i - 1) * 10, opacity: 0 }, {
        x: 0,
        y: 0,
        rotate: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 1.5,
        ease: 'back.out(1.7)',
        scrollTrigger: { trigger: q('.f-sets')[0], start: 'top 85%', toggleActions: 'play none none reverse' },
      });
      gsap.fromTo(q('.f-col'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 1.2, scrollTrigger: { trigger: q('.f-cols')[0], start: 'top 90%', toggleActions: 'play none none reverse' } });
    },
    { scope: root },
  );

  return (
    <footer ref={root} id="footer" className="relative z-10 overflow-hidden bg-ink">
      <div className="f-inner px-5 pt-[16vh] sm:px-[6vw]">
        {/* discovery set */}
        <div className="grid gap-12 border-b border-gold/10 pb-[12vh] lg:grid-cols-[1.1fr_1fr] lg:gap-[6vw]">
          <div>
            <p className="label mb-8 text-gold">Discovery Set</p>
            <h2 className="f-cta display text-[13vw] text-bone sm:text-[6.2vw]">
              Drei Welten. <em className="text-gold">Ein Kästchen.</em>
            </h2>
            <p className="mt-8 max-w-[44ch] text-[15px] leading-[1.85] text-bone/70">
              No. 1 Thunder, No. 2 Aurora und No. 3 Ember Sea — je 10 ml in einem Etui aus schwarzem Eichenholz. Der Betrag wird
              beim Kauf eines großen Flakons vollständig angerechnet.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticButton variant="solid" className="h-14 px-8 text-[12px] uppercase tracking-[0.18em]" cursorLabel="95 €">
                In den Warenkorb — 95 €
              </MagneticButton>
              <MagneticButton className="h-14 px-8 text-[12px] uppercase tracking-[0.18em]" onClick={() => scrollToTarget('#worlds')}>
                Die Welten ansehen
              </MagneticButton>
            </div>
          </div>
          <div className="f-sets flex items-end justify-center gap-3 sm:gap-5">
            {FRAGRANCES.map((f, i) => (
              <div
                key={f.id}
                data-cursor="link"
                className="f-set group relative flex h-[46vw] w-[26vw] flex-col justify-between overflow-hidden rounded-[2px] border border-gold/20 p-3 transition-[transform,border-color] duration-700 ease-[var(--ease-expo)] hover:-translate-y-4 hover:border-gold/60 sm:h-[22vw] sm:w-[9vw] sm:p-4"
                style={{ marginBottom: `${[0, 3, 1][i]}vw` }}
              >
                <div
                  className="absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-90"
                  style={{ background: `linear-gradient(180deg, transparent 20%, ${f.colors.liquid}55 70%, ${f.colors.glow}66)` }}
                />
                <span className="relative font-mono text-[9px] tracking-[0.2em] text-gold">{f.no.toUpperCase()}</span>
                <span className="display relative text-[4.4vw] italic leading-none text-bone sm:text-[1.5vw]">{f.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* newsletter + columns */}
        <div className="f-cols grid gap-14 py-[10vh] lg:grid-cols-[1.2fr_2fr]">
          <div className="f-col">
            <p className="label mb-6 text-gold">Briefe aus dem Äther</p>
            <p className="display mb-8 text-[7vw] italic leading-[1.05] text-bone sm:text-[2.4vw]">Einmal pro Jahreszeit. Nie öfter.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes('@')) setSent(true);
              }}
              className="relative flex items-center border-b border-bone/20 pb-3 focus-within:border-gold"
            >
              <AnimatePresence mode="wait" initial={false}>
                {sent ? (
                  <motion.p key="ok" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="h-12 flex-1 py-3 text-[15px] text-gold">
                    Danke. Der nächste Brief kommt mit dem Wetter.
                  </motion.p>
                ) : (
                  <motion.input
                    key="in"
                    exit={{ opacity: 0, y: -12 }}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ihre E-Mail-Adresse"
                    aria-label="E-Mail-Adresse"
                    className="h-12 flex-1 bg-transparent text-[15px] text-bone placeholder:text-mist focus:outline-none"
                  />
                )}
              </AnimatePresence>
              {!sent && (
                <MagneticButton type="submit" className="h-12 w-12 shrink-0" strength={0.6} ariaLabel="Abonnieren">
                  →
                </MagneticButton>
              )}
            </form>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title} className="f-col">
                <p className="label mb-6 text-mist">{c.title}</p>
                <ul className="space-y-3">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a href="#footer" data-cursor="link" className="group relative inline-block text-[15px] text-bone/85">
                        <span className="relative block overflow-hidden">
                          <span className="block transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-translate-y-full">{l}</span>
                          <span className="absolute inset-0 block translate-y-full italic text-gold transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-y-0">
                            {l}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* monumental wordmark */}
      <div className="f-word-wrap relative select-none overflow-hidden px-2 [perspective:900px]">
        <p className="f-word display text-center text-[25vw] leading-[0.82] text-gold" style={{ letterSpacing: '-0.02em' }} aria-hidden>
          AETHER
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-gold/10 px-5 py-6 font-mono text-[10px] uppercase tracking-[0.2em] text-mist sm:flex-row sm:items-center sm:justify-between sm:px-[6vw]">
        <span>© MMXXVI Maison Aether — Paris · Grasse</span>
        <span>
          Grasse <GrasseClock />
        </span>
        <span>
          Claude Opus · Claude Code · {BUILD_MINUTES} min
        </span>
      </div>
    </footer>
  );
}
