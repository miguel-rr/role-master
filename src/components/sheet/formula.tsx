'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Calc } from './sheet-model';

/**
 * A number with its working. Hover (or press) shows how it was computed.
 */
const Formula = ({
  calc,
  className = '',
  children,
}: {
  calc: Calc;
  className?: string;
  children?: React.ReactNode;
}) => {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAnchor(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anchor]);
  const tip = anchor ? (
    <div
      className="fixed z-[90] max-w-[26rem] animate-fade-in rounded-md border border-brass/60 bg-charcoal-950 px-3 py-2 font-scaly text-[clamp(0.95rem,1.1vw,1.35rem)] text-parchment-text shadow-[0_16px_40px_rgba(0,0,0,0.7)]"
      data-testid="formula"
      role="tooltip"
      style={{
        top: Math.max(8, anchor.top - 8),
        left: Math.min(
          Math.max(8, anchor.left + anchor.width / 2),
          window.innerWidth - 8,
        ),
        transform: 'translate(-50%, -100%)',
      }}
    >
      {calc.formula}
    </div>
  ) : null;
  return (
    <button
      className={`cursor-help rounded-sm decoration-brass/70 decoration-dotted underline-offset-[0.25em] hover:underline focus-visible:underline ${className}`}
      data-testid="calc"
      onBlur={() => setAnchor(null)}
      onClick={(e) => {
        e.stopPropagation();
        setAnchor((a) => (a ? null : e.currentTarget.getBoundingClientRect()));
      }}
      onFocus={(e) => setAnchor(e.currentTarget.getBoundingClientRect())}
      onMouseEnter={(e) => setAnchor(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => setAnchor(null)}
      ref={ref}
      title={calc.formula}
      type="button"
    >
      {children ?? calc.value}
      {tip ? createPortal(tip, document.body) : null}
    </button>
  );
};

export { Formula };
