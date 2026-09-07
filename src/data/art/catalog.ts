import 'server-only';

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { type ArtEntry, artManifestSchema } from './schema';

const MANIFESTS_DIR = path.join(process.cwd(), 'src/data/art/manifests');

/**
 * Every downloaded illustration, keyed by collection. Manifests are written
 * by `pnpm art:sync`; a missing directory simply yields an empty catalogue so
 * the app renders (with placeholders) before the first sync.
 */
const loadCatalog = cache((): Map<string, ArtEntry[]> => {
  const byCollection = new Map<string, ArtEntry[]>();
  if (!existsSync(MANIFESTS_DIR)) return byCollection;
  for (const file of readdirSync(MANIFESTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const raw = JSON.parse(
      readFileSync(path.join(MANIFESTS_DIR, file), 'utf8'),
    );
    const manifest = artManifestSchema.parse(raw);
    byCollection.set(manifest.collection, manifest.entries);
  }
  return byCollection;
});

const allArt = (): ArtEntry[] => [...loadCatalog().values()].flat();

const collection = (name: string): ArtEntry[] => loadCatalog().get(name) ?? [];

/** Entries carrying every one of `tags` (and none of `without`). */
const artWithTags = (
  tags: string[],
  { within, without = [] }: { within?: string[]; without?: string[] } = {},
): ArtEntry[] => {
  const pool = within ? within.flatMap((c) => collection(c)) : allArt();
  return pool.filter(
    (e) =>
      tags.every((t) => e.tags.includes(t)) &&
      !without.some((t) => e.tags.includes(t)),
  );
};

/** Deterministic pseudo-random pick so a given seed always shows the same art. */
const seeded = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
};

const pickArt = (entries: ArtEntry[], seed: string): ArtEntry | undefined => {
  if (entries.length === 0) return undefined;
  const rnd = seeded(seed);
  return entries[Math.floor(rnd() * entries.length)];
};

const sampleArt = (
  entries: ArtEntry[],
  n: number,
  seed: string,
): ArtEntry[] => {
  const rnd = seeded(seed);
  const copy = [...entries];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a && b) {
      copy[i] = b;
      copy[j] = a;
    }
  }
  return copy.slice(0, n);
};

/** Item icon whose title best matches a name (case-insensitive, word match). */
const findItem = (name: string): ArtEntry | undefined => {
  const items = collection('items');
  const needle = name.toLowerCase();
  return (
    items.find((e) => e.title.toLowerCase() === needle) ??
    items.find((e) => e.title.toLowerCase().startsWith(needle)) ??
    items.find((e) => e.title.toLowerCase().includes(needle))
  );
};

/** One entry by its stable id (`collection/slug`), if downloaded. */
const byId = (id: string): ArtEntry | undefined =>
  allArt().find((e) => e.id === id);

/** Entries whose source title matches (e.g. /innkeeper/i), optionally within collections. */
const findByTitle = (re: RegExp, within?: string[]): ArtEntry[] => {
  const pool = within ? within.flatMap((c) => collection(c)) : allArt();
  return pool.filter((e) => re.test(e.title));
};

const catalogStats = () =>
  [...loadCatalog().entries()].map(([name, entries]) => ({
    name,
    count: entries.length,
  }));

export {
  allArt,
  artWithTags,
  byId,
  catalogStats,
  collection,
  findByTitle,
  findItem,
  pickArt,
  sampleArt,
  seeded,
};
