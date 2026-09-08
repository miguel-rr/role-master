'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The players' notebook: a drawer that slides in from the right edge with
 * a sheet of paper to write on. Saved with the game.
 */
const NotesDrawer = ({
  open,
  notes,
  onToggle,
  onChange,
}: {
  open: boolean;
  notes: string;
  onToggle: () => void;
  onChange: (text: string) => void;
}) => {
  const [draft, setDraft] = useState(notes);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    setDraft(notes);
  }, [notes]);
  const edit = (text: string) => {
    setDraft(text);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(text), 400);
  };
  return (
    <div
      className={`fixed inset-y-0 right-0 z-[54] flex transition-transform duration-500 ${open ? 'translate-x-0' : 'pointer-events-none translate-x-full'}`}
      data-open={open ? 'yes' : 'no'}
      data-testid="notes-drawer"
    >
      <div className="paper flex h-full w-[min(90vw,32rem)] flex-col rounded-l-[3px] border-brass/40 border-l shadow-[-20px_0_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-baseline justify-between gap-3 border-ink/40 border-b px-6 pt-5 pb-3">
          <span className="font-caps text-[clamp(1.25rem,1.5vw,1.9rem)] text-maroon">
            Bloc de notas
          </span>
          <span className="font-scaly text-[clamp(0.75rem,0.85vw,1.05rem)] text-ink-muted">
            Se guarda con la partida
          </span>
          <button
            className="rounded-sm border border-ink/40 px-2 py-1 font-condensed text-[0.65rem] text-ink uppercase tracking-wider hover:bg-ink/10"
            data-testid="notes-close"
            onClick={onToggle}
            type="button"
          >
            Cerrar · N
          </button>
        </div>
        <textarea
          className="min-h-0 flex-1 resize-none bg-transparent px-6 py-4 font-book text-[clamp(1.1rem,1.3vw,1.65rem)] text-ink leading-[1.6] placeholder:text-ink-muted/70 focus:outline-none"
          data-testid="notes-text"
          onChange={(e) => edit(e.target.value)}
          placeholder="Nombres, deudas, pistas, promesas. Lo que no queréis olvidar."
          spellCheck={false}
          style={{
            backgroundImage:
              'repeating-linear-gradient(transparent, transparent calc(1.6em - 1px), rgba(88,24,13,0.18) calc(1.6em - 1px), rgba(88,24,13,0.18) 1.6em)',
            backgroundAttachment: 'local',
          }}
          value={draft}
        />
      </div>
    </div>
  );
};

export { NotesDrawer };
