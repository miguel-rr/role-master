import 'server-only';

import { artWithTags, byId, collection, pickArt } from '@/data/art/catalog';
import {
  EXCLUDED_FACES,
  type FaceRole,
  HUMAN_FACES,
} from '@/data/art/npc-faces';
import { buildPortraitPool } from '@/data/art/portrait-pool';
import type { ArtEntry } from '@/data/art/schema';
import { ICESPIRE_LORE } from '@/data/campaigns/icespire-lore';
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
    // The hand-picked backgrounds of the design lab set the bar: use one of
    // them whenever the place allows it; then painted 5e-era art; then the rest.
    const featured = pool.filter((e) => e.tags.includes('featured'));
    if (featured.length > 0) return pickArt(featured, seed);
    const modern = pool.filter((e) => e.tags.includes('5e'));
    return pickArt(modern.length >= 3 ? modern : pool, seed);
  }
  const any = collection('scenes-fr').filter(good);
  const featured = any.filter((e) => e.tags.includes('featured'));
  return pickArt(featured.length > 0 ? featured : any, seed);
};

/** Spanish words in a role → portrait tags, for narrators who forget tags. */
const ROLE_WORDS: [RegExp, string[]][] = [
  [/posader|taberner|mesoner|cantiner/i, ['innkeeper', 'merchant', 'commoner']],
  [/mercader|comerciante|tender|vendedor|buhoner/i, ['merchant']],
  [/guardia|centinela|vigilante/i, ['guard', 'soldier']],
  [
    /soldad|sargent|capitán|veteran|mercenari/i,
    ['soldier', 'fighter', 'mercenary'],
  ],
  [/caballer|paladín/i, ['knight', 'paladin']],
  [/sacerdot|clérig|acólit|monj|hermana|padre\b/i, ['priest', 'cleric']],
  [/nobl|señor|dama|barón|conde|alcaide|alcalde|lord\b/i, ['noble']],
  [/herrer|forjador/i, ['blacksmith']],
  [
    /campesin|granjer|aldean|labrieg|molinero|partera|pastor|minero|minera|obrer|pescador|carreter|leñador|criad|mozo|moza|sirvient|tabern/i,
    ['commoner'],
  ],
  [/niñ|chic|chaval|muchach|crí[oa]|huérfan|pequeñ/i, ['child']],
  [/ancian|viej|abuel|decan/i, ['elder']],
  [/mag[oa]|hechicer|bruj|archimag/i, ['wizard', 'sorcerer']],
  [/bandid|ladr|salteador|contrabandista|pícar/i, ['bandit', 'rogue']],
  [/cazador|rastreador|explorador|guardabosques/i, ['hunter', 'ranger']],
  [/pirat|marin|capitana? del barco/i, ['pirate']],
  [/cultist|sectari/i, ['cultist']],
  [/erudit|sabi|bibliotecari|escrib/i, ['scholar', 'wizard']],
  [/bard|juglar|trovador/i, ['bard']],
  [/druid/i, ['druid']],
];

/** Spanish race words in a role or a name, for narrators who forget "race". */
const RACE_WORDS: [RegExp, string][] = [
  [/\benan[oa]s?\b/i, 'dwarf'],
  [/\bsemielf[oa]s?\b|\bmedio ?elf[oa]\b/i, 'half-elf'],
  [/\bsemiorc[oa]s?\b|\bmedio ?orc[oa]\b/i, 'half-orc'],
  [/\belf[oa]s?\b|\bdrow\b/i, 'elf'],
  [/\bmedian[oa]s?\b|\bhalfling\b/i, 'halfling'],
  [/\bgnom[oa]s?\b/i, 'gnome'],
  [/\btiefling\b|\btífling\b/i, 'tiefling'],
  [/\bdracónid[oa]\b|\bdragonborn\b/i, 'dragonborn'],
  [/\bhuman[oa]s?\b/i, 'human'],
];

const AGE_TAGS: Record<'child' | 'young' | 'adult' | 'old', string[]> = {
  child: ['child'],
  young: [],
  adult: [],
  old: ['elder', 'old'],
};

/** Words of named people of the campaign, so their art is not reused. */
const OTHER_NAMES = ICESPIRE_LORE.filter((l) => l.kind === 'character')
  .flatMap((l) =>
    l.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z]+/),
  )
  .filter((w) => w.length >= 5);

/** Roles the Wizards collections portray better than Owlcat's heroes. */
const COMMON_FOLK = new Set([
  'innkeeper',
  'merchant',
  'commoner',
  'child',
  'elder',
  'priest',
  'guard',
  'soldier',
  'noble',
  'blacksmith',
]);

/**
 * Scores every portrait against the narrator's description and picks among
 * the best. Children with no child portrait in the catalogue get no face at
 * all: an empty frame reads better than a grown soldier.
 */
const pickCharacterArt = (
  figure: Extract<Figure, { kind: 'character' }>,
  npcArt: Record<string, string>,
  seed: string,
): ArtEntry | undefined => {
  // Roles in order of trust: the age, the narrator's own tags, then words
  // of the role description. The first role with hand-picked faces wins.
  const ageTags = figure.age ? AGE_TAGS[figure.age] : [];
  const ordered: string[] = [
    ...ageTags,
    ...figure.tags.map((t) => t.toLowerCase()),
  ];
  for (const [re, tags] of ROLE_WORDS)
    if (re.test(figure.role) || re.test(figure.name)) ordered.push(...tags);
  const wanted = new Set(ordered);
  // The role often says the race ("minero enano") even when the field is empty.
  const describedRace = RACE_WORDS.find(([re]) =>
    re.test(`${figure.role} ${figure.name}`),
  )?.[1];
  const figureRace = figure.race?.toLowerCase() || describedRace || 'human';
  const folk = [...wanted].some((t) => COMMON_FOLK.has(t));
  // Hand-picked faces first: the innkeeper looks like an innkeeper.
  if (figureRace === 'human' && figure.gender && figure.age !== 'child') {
    const used0 = new Set(Object.values(npcArt));
    const table = HUMAN_FACES[figure.gender];
    const roles = ordered.filter((t): t is FaceRole => t in table);
    const first = roles.find((r) => (table[r] ?? []).length > 0);
    const ids = first ? (table[first] ?? []) : [];
    const fresh = ids.filter((id) => !used0.has(id));
    const chosen = pickArt(
      (fresh.length > 0 ? fresh : ids).flatMap((id) => {
        const e = byId(id);
        return e ? [e] : [];
      }),
      seed,
    );
    if (chosen) return chosen;
  }
  const pool = [
    ...buildPortraitPool().entries,
    ...collection('portraits-fr'),
    ...collection('npcs-fr'),
  ].filter(
    (e, i, all) =>
      !EXCLUDED_FACES.has(e.id) &&
      !e.tags.includes('duplicate') &&
      !e.tags.includes('white-bg') &&
      !e.tags.includes('mono') &&
      all.findIndex((x) => x.id === e.id) === i,
  );
  // Hard filters: a person must look like the person described. No
  // creatures, the requested race (or any humanoid race), the requested sex.
  const HUMANOID = [
    'human',
    'elf',
    'dwarf',
    'halfling',
    'gnome',
    'half-elf',
    'half-orc',
    'tiefling',
    'dragonborn',
    'aasimar',
    'genasi',
    'goliath',
    'firbolg',
    'tabaxi',
    'kenku',
    'tortle',
    'lizardfolk',
    'drow',
    'duergar',
  ];
  const CREATURE = [
    'monster',
    'goblin',
    'orc',
    'kobold',
    'gnoll',
    'bugbear',
    'hobgoblin',
    'undead',
    'fiend',
    'aberration',
    'beholder',
    'beholders',
    'demons',
    'devils',
    'liches',
    'dragons',
    'fey',
    'celestial',
  ];
  const race = figureRace;
  const people = pool.filter((e) => {
    // Group scenes carry several races or both sexes: never a single face.
    const races = e.tags.filter((t) => HUMANOID.includes(t));
    if (races.length !== 1) return false;
    if (e.tags.includes('male') && e.tags.includes('female')) return false;
    // Upright portrait proportions: not a banner, not a bookmark strip.
    if (e.height < e.width * 0.75 || e.height > e.width * 1.7) return false;
    // A creature tag only passes when that creature is the requested race.
    if (e.tags.some((t) => CREATURE.includes(t) && t !== race)) return false;
    if (race && HUMANOID.includes(race)) return e.tags.includes(race);
    return true;
  });
  const sexed = figure.gender
    ? people.filter((e) => e.tags.includes(figure.gender as string))
    : people;
  const candidates = sexed.length > 0 ? sexed : people;
  if (
    figure.age === 'child' &&
    !candidates.some((e) => e.tags.includes('child'))
  ) {
    return undefined;
  }
  const used = new Set(Object.values(npcArt));
  const nameWords = figure.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 5);
  const scored = candidates.map((e) => {
    let score = 0;
    score += e.tags.includes(race) ? 4 : -3;
    if (figure.gender) score += e.tags.includes(figure.gender) ? 3 : -4;
    for (const t of wanted) if (e.tags.includes(t)) score += 3;
    if (figure.age === 'child') score += e.tags.includes('child') ? 8 : -20;
    if (figure.age === 'old')
      score += e.tags.includes('elder') || e.tags.includes('old') ? 4 : 0;
    // Heroic class portraits are a poor fit for an innkeeper or a farmer.
    const heroic = [
      'fighter',
      'wizard',
      'rogue',
      'paladin',
      'ranger',
      'barbarian',
      'sorcerer',
      'warlock',
      'monk',
      'druid',
      'bard',
      'cleric',
    ].filter((t) => e.tags.includes(t) && !wanted.has(t)).length;
    if (folk) score -= heroic * 2;
    if (folk && e.source.site !== 'kingmaker') score += 1;
    if (!folk && e.source.site === 'kingmaker') score += 1;
    // The catalogue may hold this very person (Wizards art is named)…
    const key = `${e.id} ${e.title}`.toLowerCase();
    if (nameWords.some((w) => key.includes(w))) score += 15;
    // …and it surely holds other named people: never lend the Alcaide's face.
    if (OTHER_NAMES.some((w) => !nameWords.includes(w) && key.includes(w)))
      score -= 12;
    if (used.has(e.id)) score -= 6;
    // A standing figure needs an upright painting.
    if (e.height < e.width * 0.9) score -= 5;
    return { e, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0]?.score ?? Number.NEGATIVE_INFINITY;
  const best = scored.filter((x) => x.score >= top - 1).map((x) => x.e);
  return pickArt(best, seed);
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
    const tag = figure.monsterTag.trim().toLowerCase();
    const tagged = collection('monsters-fr').filter(
      (e) =>
        (e.tags.includes(tag) || e.tags.includes(`${tag}s`)) &&
        !e.tags.includes('duplicate'),
    );
    // Upright paintings first; a landscape one (cropped by the frame) beats
    // no creature at all; a white-background cut-out is the last resort.
    const painted = tagged.filter((e) => !e.tags.includes('white-bg'));
    const tiers = [
      painted.filter((e) => e.height >= e.width * 0.8),
      painted,
      tagged,
    ];
    for (const tier of tiers) {
      if (tier.length > 0) {
        art = pickArt(tier, seed);
        break;
      }
    }
  } else {
    art = pickCharacterArt(figure, npcArt, seed);
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

export {
  MOOD_STYLE,
  monsterVocabulary,
  pickCharacterArt,
  PLACE_TAGS,
  resolveTurn,
};
