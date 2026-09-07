import 'server-only';

import { collection } from './catalog';
import type { ArtEntry } from './schema';

/**
 * The portraits the game actually offers for player characters and NPCs.
 *
 * Decision (2026-09-08): the Owlcat series (Pathfinder: Kingmaker / Wrath of
 * the Righteous) is the visual line. It is thin for some races, so Wizards
 * art fills in only for races with fewer than `MIN_OWLCAT` Owlcat portraits,
 * and only with paintings that sit well next to Owlcat's: one subject, a
 * painted background (no white cut-outs), upright framing.
 */

const RACES = [
  'human',
  'elf',
  'dwarf',
  'halfling',
  'gnome',
  'half-elf',
  'half-orc',
  'tiefling',
  'dragonborn',
] as const;

const MIN_OWLCAT = 12;
const MAX_FALLBACK_PER_RACE = 40;

type PortraitPool = {
  entries: ArtEntry[];
  perRace: Record<string, { owlcat: number; wizards: number }>;
};

const raceTagsOf = (e: ArtEntry) => RACES.filter((r) => e.tags.includes(r));

const fallbackQuality = (e: ArtEntry) => {
  let q = 0;
  if (e.tags.includes('5e')) q += 3;
  if (e.height >= e.width * 1.1) q += 2;
  if (e.tags.includes('portrait')) q += 1;
  if (e.width >= 700) q += 1;
  return q;
};

const buildPortraitPool = (): PortraitPool => {
  const owlcat = collection('portraits-kingmaker');
  const wizards = [...collection('portraits-fr'), ...collection('npcs-fr')];

  const perRace: PortraitPool['perRace'] = {};
  const entries: ArtEntry[] = [...owlcat];
  const seenPages = new Set(owlcat.map((e) => e.source.page));

  for (const race of RACES) {
    const owlcatCount = owlcat.filter((e) => e.tags.includes(race)).length;
    perRace[race] = { owlcat: owlcatCount, wizards: 0 };
    if (owlcatCount >= MIN_OWLCAT) continue;

    const candidates = wizards
      .filter((e) => {
        if (seenPages.has(e.source.page)) return false;
        const races = raceTagsOf(e);
        return (
          races.length === 1 &&
          races[0] === race &&
          !e.tags.includes('white-bg') &&
          e.height >= e.width * 0.9
        );
      })
      .sort((a, b) => fallbackQuality(b) - fallbackQuality(a))
      .slice(0, MAX_FALLBACK_PER_RACE);

    for (const c of candidates) {
      seenPages.add(c.source.page);
      entries.push(c);
    }
    perRace[race].wizards = candidates.length;
  }

  return { entries, perRace };
};

export { buildPortraitPool, RACES as PORTRAIT_RACES };
export type { PortraitPool };
