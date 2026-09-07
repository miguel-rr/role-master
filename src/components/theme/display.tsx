import type { ReactNode } from 'react';

/**
 * Nodesto (the free Modesto remake used for cover titles) ships no accented
 * capitals, so «Ó» falls back to a small-cap «ó». `Caps` renders the base
 * letter in Nodesto and draws the accent itself, keeping Spanish titles
 * correct without leaving the face. Screen readers get the original text.
 */

const ACCENTS: Record<
  string,
  {
    base: string;
    mark: 'acute' | 'grave' | 'diaeresis' | 'tilde' | 'circumflex';
  }
> = {
  á: { base: 'A', mark: 'acute' },
  é: { base: 'E', mark: 'acute' },
  í: { base: 'I', mark: 'acute' },
  ó: { base: 'O', mark: 'acute' },
  ú: { base: 'U', mark: 'acute' },
  à: { base: 'A', mark: 'grave' },
  è: { base: 'E', mark: 'grave' },
  ò: { base: 'O', mark: 'grave' },
  ü: { base: 'U', mark: 'diaeresis' },
  ï: { base: 'I', mark: 'diaeresis' },
  ñ: { base: 'N', mark: 'tilde' },
  â: { base: 'A', mark: 'circumflex' },
  ê: { base: 'E', mark: 'circumflex' },
  ô: { base: 'O', mark: 'circumflex' },
};

const Mark = ({
  kind,
}: {
  kind: NonNullable<(typeof ACCENTS)[string]>['mark'];
}) => {
  const common =
    'pointer-events-none absolute left-1/2 block -translate-x-1/2 bg-current';
  switch (kind) {
    case 'acute':
      return (
        <span
          aria-hidden="true"
          className={`${common} rotate-[30deg] rounded-full`}
          style={{
            width: '0.075em',
            height: '0.26em',
            top: '-0.1em',
            marginLeft: '0.06em',
          }}
        />
      );
    case 'grave':
      return (
        <span
          aria-hidden="true"
          className={`${common} rotate-[-30deg] rounded-full`}
          style={{
            width: '0.075em',
            height: '0.26em',
            top: '-0.1em',
            marginLeft: '-0.06em',
          }}
        />
      );
    case 'diaeresis':
      return (
        <>
          <span
            aria-hidden="true"
            className={`${common} rounded-full`}
            style={{
              width: '0.13em',
              height: '0.13em',
              top: '-0.08em',
              marginLeft: '-0.14em',
            }}
          />
          <span
            aria-hidden="true"
            className={`${common} rounded-full`}
            style={{
              width: '0.13em',
              height: '0.13em',
              top: '-0.08em',
              marginLeft: '0.14em',
            }}
          />
        </>
      );
    case 'circumflex':
      return (
        <>
          <span
            aria-hidden="true"
            className={`${common} rotate-[32deg] rounded-full`}
            style={{
              width: '0.1em',
              height: '0.3em',
              top: '-0.1em',
              marginLeft: '-0.1em',
            }}
          />
          <span
            aria-hidden="true"
            className={`${common} rotate-[-32deg] rounded-full`}
            style={{
              width: '0.1em',
              height: '0.3em',
              top: '-0.1em',
              marginLeft: '0.1em',
            }}
          />
        </>
      );
    case 'tilde':
      return (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 block -translate-x-1/2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.6"
          style={{ width: '0.62em', height: '0.24em', top: '-0.14em' }}
          viewBox="0 0 24 10"
        >
          <path d="M2 7c3-5 7-5 10 0s7 5 10 0" />
        </svg>
      );
  }
};

const Caps = ({
  children,
  className = '',
}: {
  children: string;
  className?: string;
}) => {
  const parts: ReactNode[] = [];
  let buf = '';
  let i = 0;
  for (const ch of children) {
    const acc = ACCENTS[ch.toLowerCase()];
    if (!acc) {
      buf += ch;
      continue;
    }
    if (buf) parts.push(buf);
    buf = '';
    parts.push(
      <span
        aria-hidden="true"
        className="relative inline-block"
        key={`acc-${i}`}
      >
        {acc.base}
        <Mark kind={acc.mark} />
      </span>,
    );
    i += 1;
  }
  if (buf) parts.push(buf);
  if (i === 0) return <span className={className}>{children}</span>;
  return (
    <span className={className}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">{parts}</span>
    </span>
  );
};

export { Caps };
