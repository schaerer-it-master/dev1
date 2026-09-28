'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollTrigger } from '@/lib/gsap';
import { scrollToTarget } from '@/components/providers/SmoothScroll';
import { useAether } from '@/lib/store';
import MagneticButton from '@/components/ui/MagneticButton';

const LINKS = [
  { href: '#worlds', label: 'Die Welten', no: '01' },
  { href: '#notes', label: 'Noten', no: '02' },
  { href: '#story', label: 'Atelier', no: '03' },
  { href: '#footer', label: 'Boutique', no: '04' },
];

function RollLink({ label }: { label: string }) {
  return (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-translate-y-full">{label}</span>
      <span className="absolute inset-0 block translate-y-full text-gold transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-y-0">
        {label}
      </span>
    </span>
  );
}

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const loaded = useAether((s) => s.loaded);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        setSolid(y > 80);
        setHidden(self.direction === 1 && y > window.innerHeight * 0.6);
        if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
      },
    });
    return () => st.kill();
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const go = (href: string | number) => {
    setOpen(false);
    scrollToTarget(href, { duration: 2.6 });
  };

  return (
    <>
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={loaded ? { y: hidden && !open ? -110 : 0, opacity: 1 } : { y: -30, opacity: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: loaded && !solid ? 1.2 : 0 }}
        className={`fixed inset-x-0 top-6 z-[70] transition-[background-color,border-color,backdrop-filter] duration-700 ${
          solid && !open ? 'border-b border-gold/10 bg-ink/75 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav className="mx-auto flex h-16 items-center justify-between px-5 sm:h-20 sm:px-[4vw]">
          <button onClick={() => go(0)} className="group" data-cursor="link" aria-label="Aether — nach oben">
            <span className="display flex text-[22px] tracking-[0.34em] text-bone sm:text-[26px]">
              {'AETHER'.split('').map((c, i) => (
                <span
                  key={i}
                  className="inline-block transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-translate-y-[3px] group-hover:text-gold"
                  style={{ transitionDelay: `${i * 35}ms` }}
                >
                  {c}
                </span>
              ))}
            </span>
          </button>

          <ul className="hidden items-center gap-10 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <button onClick={() => go(l.href)} className="group flex items-baseline gap-2 text-[13px] tracking-[0.08em] text-bone/85" data-cursor="link">
                  <span className="font-mono text-[10px] text-gold/60">{l.no}</span>
                  <RollLink label={l.label} />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <MagneticButton className="h-11 px-6 text-[12px] uppercase tracking-[0.16em]" onClick={() => go('#footer')} cursorLabel="Set">
                Discovery Set
              </MagneticButton>
            </div>
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 lg:hidden"
              aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
              aria-expanded={open}
            >
              <span className={`absolute h-px w-4 bg-bone transition-transform duration-500 ${open ? 'rotate-45' : '-translate-y-[3px]'}`} />
              <span className={`absolute h-px w-4 bg-bone transition-transform duration-500 ${open ? '-rotate-45' : 'translate-y-[3px]'}`} />
            </button>
          </div>
        </nav>
        <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden">
          <div ref={bar} className="h-full origin-left bg-gold/60" style={{ transform: "scaleX(0)" }} />
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[65] flex flex-col justify-between bg-ink px-6 pb-10 pt-32"
            initial={{ clipPath: 'circle(0% at 92% 7%)' }}
            animate={{ clipPath: 'circle(150% at 92% 7%)' }}
            exit={{ clipPath: 'circle(0% at 92% 7%)' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="space-y-3">
              {LINKS.map((l, i) => (
                <li key={l.href} className="overflow-hidden">
                  <motion.button
                    onClick={() => go(l.href)}
                    className="display flex items-baseline gap-4 text-[15vw] text-bone"
                    initial={{ y: '110%', rotate: 6 }}
                    animate={{ y: '0%', rotate: 0 }}
                    exit={{ y: '110%' }}
                    transition={{ duration: 0.9, delay: 0.25 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="font-mono text-xs text-gold">{l.no}</span>
                    <span className={i % 2 ? 'italic' : ''}>{l.label}</span>
                  </motion.button>
                </li>
              ))}
            </ul>
            <motion.div
              className="flex items-end justify-between"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <p className="label text-mist">
                Paris · Grasse
                <br />
                MMXXVI
              </p>
              <MagneticButton className="h-12 px-6 text-xs uppercase tracking-[0.16em]" onClick={() => go('#footer')}>
                Discovery Set
              </MagneticButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
