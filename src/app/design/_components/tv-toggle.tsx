'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'role-master:tv-mode';

/** Scales the whole UI for a television seen from the sofa. */
const TvToggle = () => {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) === '1';
      setOn(saved);
      document.documentElement.classList.toggle('tv-mode', saved);
    } catch {
      /* storage unavailable: stay off */
    }
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    document.documentElement.classList.toggle('tv-mode', next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      aria-pressed={on}
      className={`btn-ghost flex items-center gap-2 px-3 py-1.5 text-xs uppercase ${
        on ? 'bg-brass/15 text-brass-pale' : ''
      }`}
      onClick={toggle}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
      >
        <rect height="12" rx="1.5" width="18" x="3" y="4" />
        <path d="M8 20h8M12 16v4" />
      </svg>
      Modo TV {on ? 'activo' : ''}
    </button>
  );
};

export { TvToggle };
