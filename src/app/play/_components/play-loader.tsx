'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ArtEntry } from '@/data/art/schema';
import type { SoundEntry } from '@/data/sound/schema';
import type { UiCue } from '@/data/sound/vocabulary';
import { buildParty, type RosterEntry } from '@/lib/game/party';
import type { GameState } from '@/lib/game/schema';
import { loadGame } from '@/lib/game/storage';
import { GameStage } from './game-stage';
import type { CoinArt } from './party-overlay';

/** Reads the saved campaign from the browser; sends you to the menu if none. */
const PlayLoader = ({
  roster,
  itemArt,
  coinArt,
  cover,
  ui,
  intros,
}: {
  roster: RosterEntry[];
  itemArt: Record<string, ArtEntry>;
  coinArt: CoinArt;
  cover: ArtEntry | undefined;
  ui: Partial<Record<UiCue, SoundEntry>>;
  /** Campaign id → introduction paragraphs. */
  intros: Record<string, string[]>;
}) => {
  const router = useRouter();
  const [state, setState] = useState<GameState | null | undefined>(undefined);

  useEffect(() => {
    const saved = loadGame();
    if (!saved) {
      router.replace('/');
      return;
    }
    setState(saved);
  }, [router]);

  if (!state) {
    return (
      <div className="theme-beyond flex min-h-screen items-center justify-center font-caps text-2xl text-brass-pale">
        <span className="animate-ember">Abriendo la partida…</span>
      </div>
    );
  }
  return (
    <GameStage
      coinArt={coinArt}
      cover={cover}
      initial={state}
      intro={intros[state.campaignId] ?? []}
      itemArt={itemArt}
      party={buildParty(state.players, roster)}
      ui={ui}
    />
  );
};

export { PlayLoader };
