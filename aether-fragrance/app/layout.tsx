import type { Metadata, Viewport } from 'next';
import { bodoni, dmMono, hanken } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aether — Parfums du Ciel',
  description:
    'Drei Himmel, in Glas gefangen. No. 1 Thunder, No. 2 Aurora, No. 3 Ember Sea — Eaux de Parfum der Maison Aether.',
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${bodoni.variable} ${hanken.variable} ${dmMono.variable} is-loading`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
