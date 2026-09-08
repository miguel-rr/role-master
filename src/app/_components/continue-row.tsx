'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Caps } from '@/components/theme/display';
import type { ArtEntry } from '@/data/art/schema';
import type { GameState } from '@/lib/game/schema';
import { loadGame } from '@/lib/game/storage';

type ContinueRowProps = {
  covers: Record<string, ArtEntry | undefined>;
  titles: Record<string, string>;
  names: Record<string, string>;
};

/** "Seguir jugando": the saved campaign of this browser, on top of the shelf. */
const ContinueRow = ({ covers, titles, names }: ContinueRowProps) => {
  const [saved, setSaved] = useState<GameState | null>(null);
  useEffect(() => {
    setSaved(loadGame());
  }, []);
  if (!saved) return null;
  const cover = covers[saved.campaignId];
  const last = saved.history.at(-1)?.turn;
  return (
    <section
      className="mx-auto max-w-[1600px] px-6 pt-10"
      data-testid="continue-row"
    >
      <h2 className="font-caps text-2xl text-brass-pale tracking-wide">
        Seguir jugando
      </h2>
      <Link
        className="group mt-3 flex overflow-hidden rounded-lg border border-brass/50 bg-charcoal-950/80 transition hover:border-brass"
        data-testid="continue-campaign"
        href="/play"
      >
        <div className="relative h-44 w-72 shrink-0 overflow-hidden sm:w-96">
          {cover ? (
            // biome-ignore lint/performance/noImgElement: pre-sized local art
            <img
              alt=""
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              height={cover.height}
              src={cover.src}
              width={cover.width}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-charcoal-950" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-4">
          <div className="font-condensed text-[0.65rem] text-strapline uppercase tracking-widest">
            Turno {saved.history.length} · {last?.chapter ?? 'Prólogo'}
          </div>
          <div className="mt-1 truncate font-nodesto text-3xl text-brass-pale uppercase leading-none">
            <Caps>{titles[saved.campaignId] ?? saved.campaignId}</Caps>
          </div>
          <div className="mt-1 font-caps text-lg text-parchment-text">
            {last?.place ?? 'La historia está por empezar'}
          </div>
          <div className="mt-2 font-scaly text-charcoal-300 text-sm">
            {saved.players
              .map(
                (p) =>
                  `${p.name} lleva a ${names[p.characterId] ?? p.characterId}`,
              )
              .join(' · ')}
          </div>
          <div className="mt-1 font-scaly text-charcoal-400 text-xs">
            Guardado {new Date(saved.updatedAt).toLocaleString('es-ES')}
          </div>
        </div>
        <div className="flex items-center pr-6">
          <span className="btn-beyond px-5 py-2.5 text-sm uppercase">
            Continuar
          </span>
        </div>
      </Link>
    </section>
  );
};

export { ContinueRow };
