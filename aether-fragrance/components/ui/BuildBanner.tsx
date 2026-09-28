import { BUILD_MINUTES } from '@/lib/config';

export default function BuildBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-[80] flex h-6 items-center justify-center border-b border-gold/15 bg-ink/90 backdrop-blur-sm">
      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.32em] text-gold/80 sm:text-[10px]">
        <span className="inline-block h-1 w-1 rounded-full bg-gold" style={{ animation: 'pulse-dot 2.4s ease-in-out infinite' }} />
        Claude Opus <span className="text-gold/40">·</span> Claude Code <span className="text-gold/40">·</span> built in {BUILD_MINUTES} minutes
      </p>
    </div>
  );
}
