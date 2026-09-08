'use client';

import { useRef } from 'react';

type ShelfRowProps = {
  title: string;
  intro?: string;
  children: React.ReactNode;
};

/** A titled, horizontally scrolling row with arrows, like a video shelf. */
const ShelfRow = ({ title, intro, children }: ShelfRowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  return (
    <section className="group/row relative mx-auto max-w-[1600px] pt-10">
      <div className="flex items-end justify-between px-6">
        <div>
          <h2 className="font-caps text-2xl text-brass-pale tracking-wide">
            {title}
          </h2>
          {intro ? (
            <p className="mt-0.5 font-scaly text-charcoal-400 text-sm">
              {intro}
            </p>
          ) : null}
        </div>
        <div className="hidden gap-1 opacity-0 transition group-hover/row:opacity-100 md:flex">
          <button
            aria-label="Anterior"
            className="btn-ghost h-8 w-8 px-0 text-sm"
            onClick={() => scroll(-1)}
            type="button"
          >
            ‹
          </button>
          <button
            aria-label="Siguiente"
            className="btn-ghost h-8 w-8 px-0 text-sm"
            onClick={() => scroll(1)}
            type="button"
          >
            ›
          </button>
        </div>
      </div>
      <div
        className="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pt-2 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={ref}
      >
        {children}
      </div>
    </section>
  );
};

export { ShelfRow };
