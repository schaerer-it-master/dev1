import { memo } from 'react';
import type { Motif } from '@/lib/fragrances';
import { rng } from '@/lib/noise';

/** Round so server (Node) and browser trig results serialise identically. */
const n = (v: number) => Math.round(v * 100) / 100;

/** Generative line-art specimen for an ingredient. Pure SVG, seeded, no images. */
function NoteMotifImpl({ motif, color, seed = 1 }: { motif: Motif; color: string; seed?: number }) {
  const r = rng(seed * 97 + motif.length);
  const gold = '#C9A87C';
  const id = `m${seed}${motif}`;

  let body: React.ReactNode = null;
  switch (motif) {
    case 'rings':
      body = (
        <g className="motif-spin" style={{ transformOrigin: '100px 100px' }}>
          {Array.from({ length: 14 }, (_, i) => (
            <circle
              key={i}
              cx={n(100 + Math.sin(i * 0.7) * 6)}
              cy={n(100 + Math.cos(i * 0.5) * 6)}
              r={n(8 + i * 6.2)}
              fill="none"
              stroke={i % 3 === 0 ? color : gold}
              strokeOpacity={n(0.25 + (i % 4) * 0.15)}
              strokeWidth={n(i % 5 === 0 ? 1.6 : 0.6)}
              strokeDasharray={i % 2 ? `${2 + i} ${3 + i * 0.6}` : undefined}
            />
          ))}
        </g>
      );
      break;
    case 'lines':
      body = (
        <g>
          {Array.from({ length: 46 }, (_, i) => {
            const x = 12 + i * 3.9;
            const h = 40 + r() * 130;
            const bend = (r() - 0.5) * 30;
            return (
              <path
                key={i}
                d={`M${x} 190 Q ${x + bend} ${190 - h * 0.6} ${x + bend * 1.6} ${190 - h}`}
                fill="none"
                stroke={i % 4 === 0 ? gold : color}
                strokeOpacity={n(0.35 + r() * 0.5)}
                strokeWidth={n(0.7 + r())}
                className="motif-sway"
                style={{ transformOrigin: `${x}px 190px`, animationDelay: `${-r() * 4}s` }}
              />
            );
          })}
        </g>
      );
      break;
    case 'dots':
      body = (
        <g>
          {Array.from({ length: 13 * 13 }, (_, i) => {
            const x = 16 + (i % 13) * 14;
            const y = 16 + Math.floor(i / 13) * 14;
            const d = Math.hypot(x - 100, y - 100);
            const s = Math.max(0.4, 5.4 - d * 0.045 + (r() - 0.5) * 2);
            return <circle key={i} cx={n(x)} cy={n(y)} r={n(s)} fill={r() > 0.8 ? gold : color} fillOpacity={n(0.35 + r() * 0.6)} />;
          })}
        </g>
      );
      break;
    case 'waves':
      body = (
        <g>
          {Array.from({ length: 18 }, (_, i) => {
            const y = 20 + i * 9.5;
            const a = 6 + Math.sin(i * 0.6) * 5;
            const f = 0.04 + i * 0.002;
            let d = `M 0 ${y}`;
            for (let x = 0; x <= 200; x += 5) d += ` L ${x} ${n(y + Math.sin(x * f + i) * a)}`;
            return (
              <path key={i} d={d} fill="none" stroke={i % 3 ? color : gold} strokeOpacity={n(0.3 + (i % 5) * 0.12)} strokeWidth={n(i % 6 === 0 ? 1.4 : 0.7)} />
            );
          })}
        </g>
      );
      break;
    case 'blob':
      body = (
        <g filter={`url(#${id}-t)`}>
          <circle cx="100" cy="100" r="62" fill={`url(#${id}-g)`} />
          <circle cx="126" cy="80" r="26" fill={gold} fillOpacity="0.35" />
          <circle cx="78" cy="128" r="18" fill={color} fillOpacity="0.5" />
        </g>
      );
      break;
    case 'rays':
      body = (
        <g className="motif-spin" style={{ transformOrigin: '100px 100px' }}>
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const r0 = 14 + (i % 3) * 6;
            const r1 = 50 + r() * 45;
            return (
              <line
                key={i}
                x1={n(100 + Math.cos(a) * r0)}
                y1={n(100 + Math.sin(a) * r0)}
                x2={n(100 + Math.cos(a) * r1)}
                y2={n(100 + Math.sin(a) * r1)}
                stroke={i % 6 === 0 ? gold : color}
                strokeOpacity={n(0.3 + r() * 0.6)}
                strokeWidth={n(i % 6 === 0 ? 1.4 : 0.6)}
              />
            );
          })}
          <circle cx="100" cy="100" r="7" fill={gold} />
        </g>
      );
      break;
    case 'grid':
      body = (
        <g transform="translate(100 100) rotate(30) translate(-100 -100)">
          {Array.from({ length: 15 }, (_, i) => (
            <g key={i}>
              <line x1={n(10 + i * 13)} y1="0" x2={n(10 + i * 13)} y2="200" stroke={i % 4 ? color : gold} strokeOpacity={n(0.3 + (i % 3) * 0.15)} strokeWidth="0.7" />
              <line x1="0" y1={n(10 + i * 13)} x2="200" y2={n(10 + i * 13)} stroke={color} strokeOpacity={n(0.2 + (i % 2) * 0.15)} strokeWidth="0.7" />
            </g>
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <rect
              key={`r${i}`}
              x={10 + Math.floor(r() * 14) * 13}
              y={10 + Math.floor(r() * 14) * 13}
              width="13"
              height="13"
              fill={i % 3 ? color : gold}
              fillOpacity={n(0.35 + r() * 0.4)}
            />
          ))}
        </g>
      );
      break;
    case 'spiral': {
      let d = 'M 100 100';
      for (let t = 0; t < 30; t += 0.08) {
        const rad = 1.6 * Math.exp(0.105 * t);
        d += ` L ${n(100 + Math.cos(t) * rad)} ${n(100 + Math.sin(t) * rad)}`;
      }
      body = (
        <g className="motif-spin-slow" style={{ transformOrigin: '100px 100px' }}>
          <path d={d} fill="none" stroke={gold} strokeOpacity="0.8" strokeWidth="1" />
          <path d={d} fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="0.6" transform="rotate(120 100 100)" />
          <path d={d} fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="0.6" transform="rotate(240 100 100)" />
        </g>
      );
      break;
    }
    case 'shards':
      body = (
        <g>
          {Array.from({ length: 26 }, (_, i) => {
            const cx = 30 + r() * 140;
            const cy = 30 + r() * 140;
            const s = 8 + r() * 30;
            const a = r() * Math.PI * 2;
            const pts = [0, 2.1, 4.1].map((o) => `${n(cx + Math.cos(a + o + r() * 0.6) * s)},${n(cy + Math.sin(a + o + r() * 0.6) * s)}`).join(' ');
            return (
              <polygon
                key={i}
                points={pts}
                fill={i % 4 === 0 ? gold : color}
                fillOpacity={n(0.08 + r() * 0.25)}
                stroke={i % 3 ? color : gold}
                strokeOpacity={n(0.5)}
                strokeWidth="0.6"
              />
            );
          })}
        </g>
      );
      break;
  }

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        <radialGradient id={`${id}-g`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.9" />
          <stop offset="55%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-t`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed={seed}>
            <animate attributeName="baseFrequency" dur="14s" values="0.014;0.024;0.014" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="26" />
        </filter>
      </defs>
      {body}
    </svg>
  );
}

const NoteMotif = memo(NoteMotifImpl);
export default NoteMotif;
