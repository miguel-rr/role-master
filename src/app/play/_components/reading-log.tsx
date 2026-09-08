'use client';

import { useEffect, useRef } from 'react';
import { Caps } from '@/components/theme/display';
import type { PartyMember } from '@/lib/game/party';
import type { GameState } from '@/lib/game/schema';
import { BOTH } from '@/lib/game/schema';

type ReadingLogProps = {
  history: GameState['history'];
  party: PartyMember[];
  /** Pages of the current turn already read (the rest stays unread). */
  currentUpTo?: { beat: number; text: string }[];
  onClose: () => void;
};

const whoName = (who: string, party: PartyMember[]) =>
  who === BOTH ? 'Ambos' : (party.find((p) => p.id === who)?.name ?? who);

/**
 * Everything read so far, to look back on: narration on paper, the voices
 * of the scene, and the decisions in between. Reading only; nothing here
 * can be replayed.
 */
const ReadingLog = ({
  history,
  party,
  currentUpTo,
  onClose,
}: ReadingLogProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'ArrowRight') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const last = history.length - 1;
  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col bg-black/80 backdrop-blur-sm"
      data-testid="reading-log"
    >
      <div className="flex items-center gap-3 border-brass/30 border-b bg-charcoal-950/90 px-5 py-3">
        <span className="font-caps text-[clamp(1.125rem,1.4vw,1.8rem)] text-brass-pale">
          Lo leído hasta ahora
        </span>
        <span className="font-scaly text-[clamp(0.75rem,0.9vw,1.1rem)] text-charcoal-400">
          Solo lectura: las decisiones ya están tomadas.
        </span>
        <button
          className="btn-ghost ml-auto px-3 py-1.5 text-xs uppercase"
          data-testid="reading-log-close"
          onClick={onClose}
          type="button"
        >
          Volver a la escena · Esc
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
          {history.map((h, i) => {
            const isCurrent = i === last;
            const beats =
              isCurrent && currentUpTo
                ? h.turn.beats
                    .map((b, beat) => ({
                      ...b,
                      text: currentUpTo
                        .filter((p) => p.beat === beat)
                        .map((p) => p.text)
                        .join(' '),
                    }))
                    .filter((b) => b.text)
                : h.turn.beats;
            const speaker =
              h.turn.figure.kind === 'none' ? null : h.turn.figure.name;
            const action = h.action;
            const who = action.kind === 'start' ? null : action.who;
            return (
              <section key={h.turn.id}>
                {action.kind !== 'start' && who ? (
                  <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-brass/30 bg-charcoal-950/70 px-4 py-2">
                    <span className="font-condensed text-[0.65rem] text-charcoal-400 uppercase tracking-wider">
                      Decisión
                    </span>
                    <span
                      className="font-condensed text-[0.7rem] uppercase tracking-wider"
                      style={{
                        color:
                          party.find((p) => p.id === who)?.color ?? '#c3a76e',
                      }}
                    >
                      {whoName(who, party)}
                    </span>
                    <span className="font-book text-[1.05rem] text-parchment-text">
                      {action.kind === 'custom'
                        ? `«${action.text}»`
                        : action.text}
                    </span>
                    {action.kind === 'choice' && action.roll ? (
                      <span className="ml-auto font-scaly text-charcoal-300 text-sm">
                        {action.roll.skill} · d20 {action.roll.result}{' '}
                        {action.roll.modifier >= 0 ? '+' : '−'}
                        {Math.abs(action.roll.modifier)} = {action.roll.total} ·{' '}
                        {action.roll.success ? 'Éxito' : 'Fallo'}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="mb-2 flex items-baseline gap-3">
                  <span className="font-condensed text-[0.65rem] text-strapline uppercase tracking-[0.3em]">
                    {h.turn.chapter}
                  </span>
                  <span className="font-nodesto text-2xl text-white uppercase leading-none">
                    <Caps>{h.turn.place}</Caps>
                  </span>
                  <span className="font-caps text-brass-pale text-sm">
                    {h.turn.time}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {beats.map((b, j) =>
                    b.kind === 'line' ? (
                      <div
                        className="ml-auto w-[88%] rounded-lg border border-brass/50 bg-charcoal-950/95 px-5 py-4"
                        key={`${h.turn.id}-${j}`}
                      >
                        <div className="mb-1 font-caps text-base text-brass-pale">
                          {speaker ?? 'Voz'}
                        </div>
                        <p className="font-book text-[clamp(1.05rem,1.25vw,1.5rem)] text-parchment-text leading-[1.45]">
                          {b.text}
                        </p>
                      </div>
                    ) : (
                      <div
                        className="paper rounded-[3px] px-7 py-5"
                        key={`${h.turn.id}-${j}`}
                      >
                        <p className="font-book text-[clamp(1.05rem,1.25vw,1.5rem)] text-ink leading-[1.45]">
                          {b.text}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </section>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
};

export { ReadingLog };
