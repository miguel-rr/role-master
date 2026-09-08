import type { Metadata } from 'next';
import { byId } from '@/data/art/catalog';
import { buildPortraitPool } from '@/data/art/portrait-pool';
import { DEMO_CHARACTERS } from '@/data/demo/characters';
import { PlayLoader } from './_components/play-loader';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — Partida',
};

/** Resolves the party portraits on the server; the game itself is client state. */
const PlayPage = () => {
  const pool = buildPortraitPool().entries;
  const pick = (race: string, gender: string, cls: string) =>
    pool.find(
      (p) =>
        p.tags.includes(race) &&
        p.tags.includes(gender) &&
        p.tags.includes(cls),
    ) ?? pool.find((p) => p.tags.includes(race) && p.tags.includes(gender));
  const party = DEMO_CHARACTERS.map((c) => ({
    id: c.id as 'bram' | 'nissa',
    name: c.name.split(' ')[0] ?? c.name,
    color: c.id === 'bram' ? '#c19429' : '#bdd6e6',
    portrait: pick(c.raceTag, c.gender, c.classTag),
  }));
  return <PlayLoader cover={byId('scenes/fr/klauthen-vale')} party={party} />;
};

export default PlayPage;
