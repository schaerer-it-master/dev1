'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap';
import { scroll } from '@/lib/scroll';
import { FRAGRANCES } from '@/lib/fragrances';
import WorldChapter from './WorldChapter';
import ParallaxDust from '@/components/ui/ParallaxDust';

export default function Worlds() {
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const q = gsap.utils.selector(intro);
    const title = SplitText.create(q('.wi-title'), { type: 'chars,words', charsClass: 'char', wordsClass: 'word' });
    const lead = SplitText.create(q('.wi-lead'), { type: 'words', wordsClass: 'word' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: intro.current, start: 'top 85%', end: 'bottom top', scrub: 1 },
    });
    tl.fromTo(q('.wi-kicker'), { opacity: 0, letterSpacing: '1em' }, { opacity: 1, letterSpacing: '0.28em', duration: 1.2, ease: 'expo.out' }, 0)
      .fromTo(
        title.chars,
        { opacity: 0, scale: 2.4, filter: 'blur(14px)', z: 200 },
        { opacity: 1, scale: 1, filter: 'blur(0px)', z: 0, stagger: { each: 0.06, from: 'random' }, duration: 1.4, ease: 'back.out(1.4)' },
        0.1,
      )
      .fromTo(lead.words, { opacity: 0.05, y: 20 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out' }, 1)
      .to(q('.wi-inner'), { scale: 0.85, opacity: 0, filter: 'blur(12px)', duration: 1.2, ease: 'power2.in' }, 3);

    // fade the world to black before the notes
    ScrollTrigger.create({
      trigger: outro.current,
      start: 'top bottom',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scroll.outro = self.progress;
      },
      onLeaveBack: () => {
        scroll.outro = 0;
      },
    });
    const oq = gsap.utils.selector(outro);
    const line = SplitText.create(oq('.wo-line'), { type: 'chars', charsClass: 'char' });
    gsap.fromTo(
      line.chars,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.03,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: outro.current, start: 'top 70%', end: 'center center', scrub: 1 },
      },
    );
  });

  return (
    <section id="worlds" className="relative" aria-label="Die drei Welten">
      <div ref={intro} className="relative h-[140vh]">
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_50%,rgba(10,10,10,0.55),transparent)]" />
          <div className="wi-inner relative text-center [perspective:800px]">
            <p className="wi-kicker label mb-8 text-gold">Kapitel II — Die Welten</p>
            <h2 className="wi-title display text-[21vw] text-bone sm:text-[13vw]">
              Drei <em className="text-gold">Welten.</em>
            </h2>
            <p className="wi-lead mx-auto mt-8 max-w-[44ch] text-[15px] leading-[1.8] text-bone/80 sm:text-[18px]">
              Jede Flasche ein Wetter. Jedes Wetter ein Ort, eine Stunde, ein Atemzug — gesammelt dort, wo der Himmel
              am lautesten ist.
            </p>
          </div>
        </div>
        <ParallaxDust seed={3} count={30} />
      </div>

      {FRAGRANCES.map((f) => (
        <WorldChapter key={f.id} f={f} />
      ))}

      <div ref={outro} className="relative flex h-[110vh] items-end justify-center pb-[20vh]">
        <p className="wo-line display text-center text-[8vw] italic text-bone/90 sm:text-[4vw]">…und dann wird es still.</p>
      </div>
    </section>
  );
}
