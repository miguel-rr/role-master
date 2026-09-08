import type { Metadata } from 'next';
import { libraryStats, loadLibrary } from '@/lib/sound/library.server';
import { SoundLab } from './_components/sound-lab';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — Sonido',
};

/** The whole library on one page, to listen and decide what stays. */
const SoundLabPage = () => (
  <SoundLab entries={loadLibrary()} stats={libraryStats()} />
);

export default SoundLabPage;
