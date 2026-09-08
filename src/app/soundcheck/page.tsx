import type { Metadata } from 'next';
import { byId } from '@/data/art/catalog';
import { byLayer, libraryStats, uiSounds } from '@/lib/sound/library.server';
import { SoundCheck } from './_components/sound-check';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — Comprobación de sonido',
};

/** Picks a tavern to test the speakers with; any bed and track will do. */
const SoundCheckPage = () => {
  const beds = byLayer('bed');
  const music = byLayer('music');
  const sampleBeds = beds
    .filter((b) => b.tags.places.includes('tavern'))
    .slice(0, 2);
  const sampleMusic =
    music.find((m) => m.tags.situations.includes('tavern')) ?? music[0] ?? null;
  return (
    <SoundCheck
      cover={byId('scenes/fr/crimman-club')}
      sampleBeds={sampleBeds.length > 0 ? sampleBeds : beds.slice(0, 1)}
      sampleMusic={sampleMusic}
      stats={libraryStats()}
      ui={uiSounds()}
    />
  );
};

export default SoundCheckPage;
