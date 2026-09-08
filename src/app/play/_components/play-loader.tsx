'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ArtEntry } from '@/data/art/schema';
import type { GameState } from '@/lib/game/schema';
import { loadGame } from '@/lib/game/storage';
import { GameStage, type PartyMember } from './game-stage';

/** Reads the saved campaign from the browser; sends you to the menu if none. */
const PlayLoader = ({
  party,
  cover,
}: {
  party: PartyMember[];
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
  return <GameStage cover={cover} initial={state} party={party} />;
};

export { PlayLoader };
