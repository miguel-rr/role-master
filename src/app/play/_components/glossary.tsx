'use client';

import { useEffect, useMemo, useState } from 'react';
import { Caps } from '@/components/theme/display';
import {
  LORE_KIND_LABEL,
  LORE_KINDS,
  type LoreEntry,
  type LoreKind,
} from '@/lib/game/lore';

/**
 * Everything the table knows, by kind: one card per name with where it was
 * first read and what has been learnt since, turn by turn.
 */
const Glossary = ({
  lore,
  focusId,
  onClose,
}: {
  lore: LoreEntry[];
  focusId?: string | null;
  onClose: () => void;
}) => {
  const focused = focusId ? lore.find((e) => e.id === focusId) : undefined;
  const [kind, setKind] = useState<LoreKind | 'all'>(focused?.kind ?? 'all');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  const counts = useMemo(() => {
    const c: Partial<Record<LoreKind, number>> = {};
    for (const e of lore) c[e.kind] = (c[e.kind] ?? 0) + 1;
    return c;
  }, [lore]);
  const list = lore
    .filter((e) => kind === 'all' || e.kind === kind)
    .filter(
      (e) =>
        !query ||
        `${e.name} ${e.aliases.join(' ')} ${e.summary}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return (
    <div
      className="fixed inset-0 z-[56] flex flex-col bg-black/80 backdrop-blur-sm"
      data-testid="glossary"
    >
      <div className="flex flex-wrap items-center gap-3 border-brass/30 border-b bg-charcoal-950/90 px-5 py-3">
        <span className="font-caps text-[clamp(1.125rem,1.4vw,1.8rem)] text-brass-pale">
          Glosario
        </span>
        <div className="flex flex-wrap overflow-hidden rounded border border-white/15">
          {(['all', ...LORE_KINDS] as const).map((k) => (
            <button
              className={`px-3 py-1.5 font-condensed text-[clamp(0.7rem,0.85vw,1.05rem)] uppercase tracking-wider ${kind === k ? 'bg-white/15 text-white' : 'text-charcoal-300 hover:text-white'}`}
              data-testid={`glossary-kind-${k}`}
              key={k}
              onClick={() => setKind(k)}
              type="button"
            >
              {k === 'all'
                ? `Todo · ${lore.length}`
                : `${LORE_KIND_LABEL[k]} · ${counts[k] ?? 0}`}
            </button>
          ))}
        </div>
        <input
          className="rounded border border-white/15 bg-charcoal-950 px-3 py-1.5 font-scaly text-[clamp(0.9rem,1vw,1.2rem)] text-white placeholder:text-charcoal-500"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          value={query}
        />
        <button
          className="btn-ghost ml-auto px-3 py-1.5 text-xs uppercase"
          data-testid="glossary-close"
          onClick={onClose}
          type="button"
        >
          Volver a la escena · Esc
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto grid max-w-[1500px] gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => (
            <article
              className={`rounded-md border bg-charcoal-950/85 px-5 py-4 ${e.id === focusId ? 'border-brass' : 'border-white/10'}`}
              data-testid="glossary-entry"
              key={e.id}
            >
              <div className="font-condensed text-[clamp(0.65rem,0.8vw,1rem)] text-strapline uppercase tracking-widest">
                {LORE_KIND_LABEL[e.kind]} · {e.firstSeen.label}
                {e.firstSeen.turn > 0 ? ` · turno ${e.firstSeen.turn}` : ''}
              </div>
              <div className="mt-1 font-nodesto text-[clamp(1.4rem,1.7vw,2.2rem)] text-brass-pale uppercase leading-none">
                <Caps>{e.name}</Caps>
              </div>
              {e.aliases.length > 0 ? (
                <div className="mt-1 font-scaly text-[clamp(0.8rem,0.9vw,1.1rem)] text-charcoal-400">
                  También: {e.aliases.join(', ')}
                </div>
              ) : null}
              <p className="mt-2 font-book text-[clamp(1rem,1.15vw,1.45rem)] text-parchment-text leading-snug">
                {e.summary}
              </p>
              {e.events.length > 0 ? (
                <ol className="mt-3 space-y-1.5 border-brass/25 border-t pt-2">
                  {e.events.map((ev) => (
                    <li
                      className="flex gap-2 font-scaly text-[clamp(0.85rem,1vw,1.25rem)] text-charcoal-200"
                      key={`${ev.turn}-${ev.text.slice(0, 24)}`}
                    >
                      <span className="w-[4.5em] shrink-0 font-condensed text-[0.85em] text-charcoal-500 uppercase tracking-wider">
                        Turno {ev.turn}
                      </span>
                      <span>{ev.text}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </article>
          ))}
          {list.length === 0 ? (
            <p className="font-scaly text-charcoal-400">
              Nada todavía. La historia lo irá llenando.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export { Glossary };
