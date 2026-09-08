'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ArtEntry } from '@/data/art/schema';
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
}: {
  roster: RosterEntry[];
  itemArt: Record<string, ArtEntry>;
  coinArt: CoinArt;
  cover: ArtEntry | undefined;
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
      itemArt={itemArt}
      party={buildParty(state.players, roster)}
    />
  );
};

export { PlayLoader };
