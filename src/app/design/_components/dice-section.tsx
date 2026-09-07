'use client';

import dynamic from 'next/dynamic';

// The dice engine touches WebGL, workers and OffscreenCanvas: browser only.
const DiceTray = dynamic(() => import('./dice-tray').then((m) => m.DiceTray), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex h-[26rem] max-w-7xl items-center justify-center rounded-lg border border-charcoal-700 bg-charcoal-950 font-caps text-brass-pale text-xl">
      Cargando la bandeja de dados…
    </div>
  ),
});

type Player = { id: string; name: string; color: string };

const DiceSection = ({ players }: { players: [Player, Player] }) => (
  <DiceTray players={players} />
);

export { DiceSection };
