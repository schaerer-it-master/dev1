'use client';

import { useEffect, useRef, type ReactNode, type MouseEvent } from 'react';
import { gsap } from '@/lib/gsap';

type Props = {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  href?: string;
  ariaLabel?: string;
  variant?: 'outline' | 'solid' | 'ghost';
  type?: 'button' | 'submit';
  cursorLabel?: string;
};

/**
 * Pulls towards the cursor (the label a little further, for depth), springs back with
 * an elastic overshoot, and floods with gold from the point where the cursor entered.
 */
export default function MagneticButton({
  children,
  className = '',
  strength = 0.4,
  onClick,
  onMouseEnter,
  onMouseLeave,
  href,
  ariaLabel,
  variant = 'outline',
  type = 'button',
  cursorLabel,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const inner = label.current;
    if (!el || !inner || window.matchMedia('(pointer: coarse)').matches) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 1, ease: 'elastic.out(1, 0.32)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 1, ease: 'elastic.out(1, 0.32)' });
    const ixTo = gsap.quickTo(inner, 'x', { duration: 1, ease: 'elastic.out(1, 0.32)' });
    const iyTo = gsap.quickTo(inner, 'y', { duration: 1, ease: 'elastic.out(1, 0.32)' });
    const move = (e: globalThis.MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      xTo(x * strength);
      yTo(y * strength);
      ixTo(x * strength * 0.45);
      iyTo(y * strength * 0.45);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
      ixTo(0);
      iyTo(0);
    };
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    };
  }, [strength]);

  const setOrigin = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const base =
    'magnetic relative inline-flex items-center justify-center overflow-hidden rounded-full will-change-transform select-none';
  const skin =
    variant === 'solid'
      ? 'bg-bone text-ink'
      : variant === 'ghost'
        ? 'text-bone'
        : 'border border-gold/40 text-bone backdrop-blur-[2px]';

  const content = (
    <>
      {variant !== 'ghost' && <span className="magnetic-fill" aria-hidden />}
      <span ref={label} className="magnetic-label relative z-10 inline-flex items-center gap-3 transition-colors duration-500">
        {children}
      </span>
    </>
  );

  const shared = {
    className: `${base} ${skin} ${className}`,
    'data-cursor': 'link',
    'data-cursor-label': cursorLabel,
    onMouseEnter: (e: MouseEvent<HTMLElement>) => {
      setOrigin(e);
      onMouseEnter?.();
    },
    onMouseLeave: (e: MouseEvent<HTMLElement>) => {
      setOrigin(e);
      onMouseLeave?.();
    },
    'aria-label': ariaLabel,
  };

  if (href) {
    return (
      <a ref={ref as React.RefObject<HTMLAnchorElement>} href={href} {...shared} onClick={onClick}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref as React.RefObject<HTMLButtonElement>} type={type} {...shared} onClick={onClick}>
      {content}
    </button>
  );
}
