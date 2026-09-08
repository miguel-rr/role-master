import 'server-only';

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import {
  type SoundEntry,
  type SoundLayer,
  soundManifestSchema,
} from '@/data/sound/schema';
import type { UiCue } from '@/data/sound/vocabulary';

const MANIFESTS_DIR = path.join(process.cwd(), 'src/data/sound/manifests');

/** All manifests, read once per request. */
const loadLibrary = cache((): SoundEntry[] => {
  let files: string[] = [];
  try {
    files = readdirSync(MANIFESTS_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  return files.flatMap((f) => {
    const parsed = soundManifestSchema.safeParse(
      JSON.parse(readFileSync(path.join(MANIFESTS_DIR, f), 'utf8')),
    );
    return parsed.success ? parsed.data.entries : [];
  });
});

const byLayer = (layer: SoundLayer) =>
  loadLibrary().filter((e) => e.layer === layer);

const soundById = (id: string) => loadLibrary().find((e) => e.id === id);

/** Interface sounds by cue name, for the client. */
const uiSounds = (): Partial<Record<UiCue, SoundEntry>> => {
  const out: Partial<Record<UiCue, SoundEntry>> = {};
  for (const e of byLayer('ui')) if (e.tags.cue) out[e.tags.cue as UiCue] = e;
  return out;
};

const libraryStats = () => {
  const all = loadLibrary();
  const count = (l: SoundLayer) => all.filter((e) => e.layer === l).length;
  return {
    music: count('music'),
    beds: count('bed'),
    spots: count('spot'),
    sfx: count('sfx'),
    ui: count('ui'),
    total: all.length,
  };
};

export { byLayer, libraryStats, loadLibrary, soundById, uiSounds };
