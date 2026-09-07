import type { ReactNode } from 'react';

type PaperProps = {
  children: ReactNode;
  className?: string;
  /** Paper tint. */
  tone?: 'page' | 'light' | 'stat' | 'note';
  /** The 6px orange bars that top and tail a 2014 stat block. */
  bars?: boolean;
  /** Corner flourishes in gold. */
  corners?: boolean;
};

const toneClass: Record<NonNullable<PaperProps['tone']>, string> = {
  page: '',
  light: 'paper-light',
  stat: 'paper-stat',
  note: 'paper-note',
};

/** A sheet of 5e parchment: grain, warm vignette and the book's shadow. */
const Paper = ({
  children,
  className = '',
  tone = 'page',
  bars = false,
  corners = false,
}: PaperProps) => (
  <div className={`paper ${toneClass[tone]} ${className}`}>
    {bars ? <StatBar position="top" /> : null}
    {corners ? <Corners /> : null}
    {children}
    {bars ? <StatBar position="bottom" /> : null}
  </div>
);

const StatBar = ({ position }: { position: 'top' | 'bottom' }) => (
  <div
    aria-hidden="true"
    className={`absolute inset-x-[-2px] h-1.5 bg-ribbon ${
      position === 'top' ? 'top-[-3px]' : 'bottom-[-3px]'
    }`}
    style={{
      backgroundImage:
        'linear-gradient(90deg, #a8651d 0%, #e69a28 12%, #f2c46a 50%, #e69a28 88%, #a8651d 100%)',
      boxShadow: '0 1px 1px rgba(0,0,0,0.35)',
    }}
  />
);

/** Four small gold volutes, one per corner. */
const Corners = () => (
  <>
    {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute text-gold-page ${
          c === 'tl'
            ? 'top-2 left-2'
            : c === 'tr'
              ? 'top-2 right-2 -scale-x-100'
              : c === 'bl'
                ? 'bottom-2 left-2 -scale-y-100'
                : 'right-2 bottom-2 -scale-100'
        }`}
        fill="none"
        key={c}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
        style={{ width: 28, height: 28 }}
        viewBox="0 0 28 28"
      >
        <path d="M2 26V8c0-3.3 2.7-6 6-6h18" />
        <path d="M6 22V10a4 4 0 0 1 4-4h12" opacity="0.6" />
        <circle cx="4" cy="4" fill="currentColor" r="1.3" stroke="none" />
      </svg>
    ))}
  </>
);

export { Paper };
