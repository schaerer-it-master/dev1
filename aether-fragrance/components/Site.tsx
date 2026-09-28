'use client';

import dynamic from 'next/dynamic';
import { bodoni } from '@/app/fonts';
import SmoothScroll from './providers/SmoothScroll';
import BuildBanner from './ui/BuildBanner';
import Cursor from './ui/Cursor';
import Preloader from './ui/Preloader';
import Nav from './sections/Nav';
import Hero from './sections/Hero';
import Worlds from './sections/Worlds';
import Notes from './sections/Notes';
import Story from './sections/Story';
import Footer from './sections/Footer';

const Experience = dynamic(() => import('./3d/Experience'), { ssr: false });

export default function Site() {
  return (
    <SmoothScroll>
      <BuildBanner />
      <Nav />
      <div className="fixed inset-0 z-0" aria-hidden>
        <Experience displayFont={bodoni.style.fontFamily} />
      </div>
      <main className="relative z-10">
        <Hero />
        <Worlds />
        <Notes />
        <Story />
        <Footer />
      </main>
      <div className="vignette" aria-hidden />
      <div className="grain" aria-hidden />
      <Cursor />
      <Preloader />
    </SmoothScroll>
  );
}
