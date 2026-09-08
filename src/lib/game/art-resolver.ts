import 'server-only';

import { artWithTags, byId, collection, pickArt } from '@/data/art/catalog';
import { buildPortraitPool } from '@/data/art/portrait-pool';
import type { ArtEntry } from '@/data/art/schema';
import type { Figure, Mood, ResolvedTurn, SceneTurn } from './schema';

/**
 * Turns the narrator's tags into pictures. Backgrounds come from the scene
 * collections; characters from the portrait pool (Owlcat first); creatures
 * from the monster collection. Faces stick to `npcId` across turns.
 */

/** Place tags with real coverage, offered to the narrator as vocabulary. */
const PLACE_TAGS = [
  'taverns',
  'inns',
  'settlements',
  'cities',
  'buildings',
  'markets',
  'temples',
  'castles',
  'towers',
  'libraries',
  'prisons',
  'sewers',
  'ruins',
  'graveyards',
  'forests',
  'jungles',
  'swamps',
  'mountains',
  'snow',
  'rivers',
  'lakes',
  'bridges',
  'roads',
  'deserts',
  'caves',
  'mines',
  'dungeons',
  'underdark',
  'ships',
  'phandalin',
  'neverwinter',
  'barovia',
] as const;

const MOOD_STYLE: Record<Mood, { grade: string; accent: string }> = {
  warm: {
    grade: 'linear-gradient(180deg, rgba(120,60,10,0.18), rgba(20,10,5,0.35))',
    accent: '#e69a28',
  },
  cold: {
    grade:
      'linear-gradient(180deg, rgba(150,180,220,0.2), rgba(10,15,30,0.45))',
    accent: '#bdd6e6',
  },
  dark: {
    grade: 'linear-gradient(180deg, rgba(20,20,50,0.35), rgba(5,5,15,0.55))',
    accent: '#a7080b',
  },
  gold: {
    grade: 'linear-gradient(180deg, rgba(20,20,60,0.18), rgba(10,5,20,0.42))',
    accent: '#c19429',
  },
  green: {
    grade: 'linear-gradient(180deg, rgba(20,60,30,0.22), rgba(5,15,10,0.45))',
    accent: '#82b28f',
  },
  blood: {
    grade: 'linear-gradient(180deg, rgba(90,10,10,0.3), rgba(20,5,5,0.5))',
    accent: '#e40712',
  },
};

/** Monster tags present in the catalogue with at least `min` pictures. */
const monsterVocabulary = (min = 3): string[] => {
  const counts = new Map<string, number>();
  for (const e of collection('monsters-fr')) {
    if (e.tags.includes('duplicate') || e.tags.includes('white-bg')) continue;
    for (const t of e.tags) {
      if (['monster', '5e', 'male', 'female', 'portrait'].includes(t)) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= min)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);
};

const resolveBackground = (
  turn: SceneTurn,
  seed: string,
  previous?: { place: string; backgroundId?: string },
): ArtEntry | undefined => {
  // Same place as the last turn: keep the same picture. Continuity beats variety.
  if (
    previous?.backgroundId &&
    previous.place.trim().toLowerCase() === turn.place.trim().toLowerCase()
  ) {
    const kept = byId(previous.backgroundId);
    if (kept) return kept;
  }
  const good = (e: ArtEntry) =>
    e.width >= 1100 &&
    e.width >= e.height * 0.95 &&
    !e.tags.includes('duplicate') &&
    !e.tags.includes('mono');
  for (const tag of turn.sceneTags) {
    const pool = artWithTags([tag], { within: ['scenes-fr'] }).filter(good);
    if (pool.length === 0) continue;
    // Painted 5e-era art first; older editions only if that is all there is.
    const modern = pool.filter((e) => e.tags.includes('5e'));
    return pickArt(modern.length >= 3 ? modern : pool, seed);
  }
  const any = collection('scenes-fr').filter(good);
  return pickArt(any, seed);
};

const resolveFigure = (
  figure: Figure,
  npcArt: Record<string, string>,
  seed: string,
): { art: ArtEntry | undefined; npcArt: Record<string, string> } => {
  if (figure.kind === 'none') return { art: undefined, npcArt };
  const known = npcArt[figure.npcId];
  if (known) {
    const art = byId(known);
    if (art) return { art, npcArt };
  }
  let art: ArtEntry | undefined;
  if (figure.kind === 'creature') {
    const pool = collection('monsters-fr').filter(
      (e) =>
        e.tags.includes(figure.monsterTag) &&
        !e.tags.includes('duplicate') &&
        !e.tags.includes('white-bg') &&
        e.height >= e.width * 0.8,
    );
    art = pickArt(pool, seed);
  } else {
    const pool = buildPortraitPool().entries;
    const has = (e: ArtEntry, t?: string) => !t || e.tags.includes(t);
    const tiers = [
      pool.filter(
        (e) =>
          has(e, figure.race) &&
          has(e, figure.gender) &&
          figure.tags.some((t) => e.tags.includes(t)),
      ),
      pool.filter((e) => has(e, figure.race) && has(e, figure.gender)),
      pool.filter((e) => has(e, figure.race)),
      pool.filter((e) => figure.tags.some((t) => e.tags.includes(t))),
      pool,
    ];
    // Avoid handing a face already used by another NPC.
    const used = new Set(Object.values(npcArt));
    for (const tier of tiers) {
      const fresh = tier.filter((e) => !used.has(e.id));
      const candidates = fresh.length > 0 ? fresh : tier;
      if (candidates.length > 0) {
        art = pickArt(candidates, seed);
        break;
      }
    }
  }
  return {
    art,
    npcArt: art ? { ...npcArt, [figure.npcId]: art.id } : npcArt,
  };
};

const resolveTurn = (
  turn: SceneTurn,
  id: string,
  npcArt: Record<string, string>,
  previous?: { place: string; backgroundId?: string },
): { resolved: ResolvedTurn; npcArt: Record<string, string> } => {
  const background = resolveBackground(turn, `${id}:bg`, previous);
  const fig = resolveFigure(turn.figure, npcArt, `${id}:fig`);
  const style = MOOD_STYLE[turn.mood];
  return {
    resolved: {
      ...turn,
      id,
      background,
      figureArt: fig.art,
      focus: '50% 45%',
      grade: style.grade,
      accent: style.accent,
    },
    npcArt: fig.npcArt,
  };
};

export { MOOD_STYLE, monsterVocabulary, PLACE_TAGS, resolveTurn };
