import type { Metadata } from 'next';
import { byId } from '@/data/art/catalog';
import { coinArt, itemArtMap, rosterArt } from '@/lib/game/roster.server';
import { uiSounds } from '@/lib/sound/library.server';
import { PlayLoader } from './_components/play-loader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — Partida',
};

/** Resolves the roster art on the server; the game itself is client state. */
const PlayPage = () => (
  <PlayLoader
    coinArt={coinArt()}
    cover={byId('scenes/fr/klauthen-vale')}
    itemArt={itemArtMap()}
    roster={rosterArt()}
    ui={uiSounds()}
  />
);

export default PlayPage;
