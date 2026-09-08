import type { ArtSite } from '../../src/data/art/schema';
import type { WikiFile } from './wiki';

/** How a downloaded image is re-encoded. */
type Transform = {
  maxSide: number;
  quality: number;
  /** Keep the alpha channel (icons). */
  alpha?: boolean;
};

type CategorySpec = {
  name: string;
  /** Extra tags for everything under this category. */
  tags?: string[];
  /** Walk subcategories this deep (0 = only the category itself). */
  depth?: number;
  /** Keep at most this many files from this category (after ranking). */
  max?: number;
};

type TagContext = {
  /** The category the file was listed under. */
  category: string;
  /** Ancestors of that category within the job's tree, root first. */
  path: string[];
};

type Job = {
  name: string;
  site: ArtSite;
  apiUrl: string;
  /** Directory under `public/art`. */
  outDir: string;
  categories: CategorySpec[];
  transform: Transform;
  minWidth?: number;
  /** Files whose categories match any of these are dropped. */
  excludeCategories?: RegExp[];
  excludeTitles?: RegExp;
  /** Only keep public-domain files (Commons `extmetadata`). */
  requirePublicDomain?: boolean;
  /** Ask the wiki for a server-side thumbnail of this width (Commons). */
  thumbWidth?: number;
  /** Returns the tags for a file, or null to skip it. */
  tag: (file: WikiFile, ctx: TagContext) => string[] | null;
  /** Higher ranks first when a category has a `max`. */
  rank?: (file: WikiFile, tags: string[]) => number;
};

const BG3_API = 'https://bg3.wiki/w/api.php';
const FR_API = 'https://forgottenrealms.fandom.com/api.php';
const KINGMAKER_API = 'https://pathfinderkingmaker.fandom.com/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ─── Baldur's Gate 3: inventory icons ───────────────────────────────────────

/** "Longsword tooltip images" → "longsword"; "Armour (Light) tooltip images" → "armour-light". */
const bg3CategoryTag = (category: string) =>
  slugify(category.replace(/ tooltip images$/i, ''));

const bg3Items: Job = {
  name: 'items',
  site: 'bg3',
  apiUrl: BG3_API,
  outDir: 'items',
  categories: [{ name: 'Item tooltip images', depth: 4 }],
  transform: { maxSide: 256, quality: 88, alpha: true },
  excludeTitles: /(Unfaded|Controller)\.png$/i,
  tag: (_file, { category, path }) => {
    const tags = ['item'];
    for (const c of [...path.slice(1), category]) tags.push(bg3CategoryTag(c));
    return tags;
  },
};

// ─── Forgotten Realms Wiki: painted official art ────────────────────────────

const FR_EXCLUDE = [
  /Screenshots?/i,
  /Book covers?/i,
  /Covers$/i,
  /^Maps|Images of maps|Maps of/i,
  /Miniatures/i,
  /Comics?/i,
  /Logos?/i,
  /Symbols?/i,
  /Card art|Magic: The Gathering|Trading cards/i,
  /Icons?/i,
  /Tokens?/i,
  /Images from video games/i,
  /Images from Baldur's Gate 3/i,
  /Images from Neverwinter \(/i,
  /Images from Idle Champions/i,
  /Concept art/i,
  /Deleted/i,
  /Images of dice|Images of merchandise|Images of products/i,
  /Diagrams?/i,
];

const FR_RACE: Record<string, string> = {
  humans: 'human',
  elves: 'elf',
  'sun elves': 'elf',
  'moon elves': 'elf',
  'wood elves': 'elf',
  'wild elves': 'elf',
  'high elves': 'elf',
  drow: 'drow',
  dwarves: 'dwarf',
  'shield dwarves': 'dwarf',
  'gold dwarves': 'dwarf',
  duergar: 'duergar',
  halflings: 'halfling',
  'lightfoot halflings': 'halfling',
  'strongheart halflings': 'halfling',
  gnomes: 'gnome',
  'rock gnomes': 'gnome',
  'forest gnomes': 'gnome',
  'deep gnomes': 'gnome',
  'half-elves': 'half-elf',
  'half-orcs': 'half-orc',
  tieflings: 'tiefling',
  dragonborn: 'dragonborn',
  orcs: 'orc',
  goblins: 'goblin',
  hobgoblins: 'hobgoblin',
  bugbears: 'bugbear',
  kobolds: 'kobold',
  gnolls: 'gnoll',
  lizardfolk: 'lizardfolk',
  aasimar: 'aasimar',
  goliaths: 'goliath',
  tabaxi: 'tabaxi',
  genasi: 'genasi',
  firbolgs: 'firbolg',
  kenku: 'kenku',
  tortles: 'tortle',
};

const FR_CLASS: Record<string, string> = {
  wizards: 'wizard',
  fighters: 'fighter',
  clerics: 'cleric',
  rogues: 'rogue',
  thieves: 'rogue',
  rangers: 'ranger',
  paladins: 'paladin',
  bards: 'bard',
  druids: 'druid',
  monks: 'monk',
  barbarians: 'barbarian',
  sorcerers: 'sorcerer',
  warlocks: 'warlock',
  knights: 'knight',
  priests: 'priest',
  assassins: 'assassin',
  pirates: 'pirate',
  archers: 'archer',
  necromancers: 'necromancer',
};

const FR_ROLE: Record<string, string> = {
  nobles: 'noble',
  merchants: 'merchant',
  innkeepers: 'innkeeper',
  guards: 'guard',
  soldiers: 'soldier',
  commoners: 'commoner',
  farmers: 'farmer',
  sailors: 'sailor',
  bandits: 'bandit',
  cultists: 'cultist',
  mercenaries: 'mercenary',
  kings: 'royalty',
  queens: 'royalty',
  children: 'child',
  'elderly people': 'elder',
  blacksmiths: 'blacksmith',
  hunters: 'hunter',
  scholars: 'scholar',
  monarchs: 'royalty',
  adventurers: 'adventurer',
};

/** Tags derived from a Forgotten Realms file's own categories. */
const frTagsFromCategories = (cats: string[]): string[] => {
  const tags = new Set<string>();
  for (const raw of cats) {
    const m = /^Images of (.+)$/.exec(raw);
    if (raw === 'Images from 5th edition sourcebooks') tags.add('5e');
    if (!m) continue;
    const key = (m[1] ?? '').toLowerCase();
    if (key === 'males') tags.add('male');
    else if (key === 'females') tags.add('female');
    else if (FR_RACE[key]) tags.add(FR_RACE[key]);
    else if (FR_CLASS[key]) tags.add(FR_CLASS[key]);
    else if (FR_ROLE[key]) tags.add(FR_ROLE[key]);
  }
  return [...tags];
};

/** Keep only the informative raw categories for later re-tagging. */
const frTrimCats = (cats: string[]) =>
  cats.filter((c) => /^Images of |^Images from /.test(c));

const isImageMime = (mime: string) => /^image\/(jpeg|png|webp)$/.test(mime);

const frRank = (file: WikiFile, tags: string[], portrait: boolean) => {
  const { width, height } = file.info;
  const aspect = height / width;
  let score = Math.min(width, 1600) / 16;
  if (tags.includes('5e')) score += 100;
  if (
    /Images from Player's Handbook|Monster Manual|Dungeon Master's Guide/.test(
      file.categories.join('|'),
    )
  )
    score += 20;
  if (portrait && aspect >= 0.85) score += 40;
  if (!portrait && aspect <= 0.9) score += 40;
  return score;
};

const frJob = (
  name: string,
  outDir: string,
  categories: CategorySpec[],
  { portrait, transform }: { portrait: boolean; transform: Transform },
): Job => ({
  name,
  site: 'fr',
  apiUrl: FR_API,
  outDir,
  categories,
  transform,
  minWidth: 600,
  excludeCategories: FR_EXCLUDE,
  tag: (file, { category }) => {
    if (!isImageMime(file.info.mime)) return null;
    const own = frTagsFromCategories(file.categories);
    const fromRoot = frTagsFromCategories([category]);
    return [...new Set([...fromRoot, ...own])];
  },
  rank: (file, tags) => frRank(file, tags, portrait),
});

const PORTRAIT_TRANSFORM: Transform = { maxSide: 900, quality: 80 };
const SCENE_TRANSFORM: Transform = { maxSide: 1500, quality: 76 };

const frRaces = frJob(
  'portraits-fr',
  'portraits/fr',
  [
    { name: 'Images of humans', max: 160, tags: ['portrait'] },
    { name: 'Images of elves', max: 140, tags: ['portrait'] },
    { name: 'Images of dwarves', max: 140, tags: ['portrait'] },
    { name: 'Images of halflings', max: 120, tags: ['portrait'] },
    { name: 'Images of gnomes', max: 120, tags: ['portrait'] },
    { name: 'Images of half-elves', max: 120, tags: ['portrait'] },
    { name: 'Images of half-orcs', max: 120, tags: ['portrait'] },
    { name: 'Images of tieflings', max: 140, tags: ['portrait'] },
    { name: 'Images of dragonborn', max: 120, tags: ['portrait'] },
  ],
  { portrait: true, transform: PORTRAIT_TRANSFORM },
);

const frNpcs = frJob(
  'npcs-fr',
  'portraits/npc',
  [
    'nobles',
    'merchants',
    'innkeepers',
    'guards',
    'soldiers',
    'commoners',
    'farmers',
    'sailors',
    'pirates',
    'bandits',
    'cultists',
    'mercenaries',
    'priests',
    'knights',
    'children',
    'blacksmiths',
    'hunters',
    'scholars',
    'wizards',
    'druids',
    'bards',
    'clerics',
    'rogues',
    'rangers',
    'paladins',
    'fighters',
    'barbarians',
    'monks',
    'sorcerers',
    'warlocks',
  ].map((k) => ({ name: `Images of ${k}`, max: 45, tags: ['portrait'] })),
  { portrait: true, transform: PORTRAIT_TRANSFORM },
);

const MONSTERS = [
  'goblins',
  'hobgoblins',
  'bugbears',
  'kobolds',
  'orcs',
  'gnolls',
  'ogres',
  'trolls',
  'owlbears',
  'wolves',
  'dire wolves',
  'worgs',
  'giant spiders',
  'skeletons',
  'zombies',
  'ghouls',
  'ghosts',
  'specters',
  'wraiths',
  'wights',
  'banshees',
  'vampires',
  'vampire spawn',
  'werewolves',
  'wererats',
  'mummies',
  'animated armors',
  'flying swords',
  'gargoyles',
  'mimics',
  'gelatinous cubes',
  'black puddings',
  'ochre jellies',
  'gray oozes',
  'beholders',
  'mind flayers',
  'nothics',
  'flameskulls',
  'manticores',
  'ankhegs',
  'stirges',
  'twig blights',
  'needle blights',
  'vine blights',
  'harpies',
  'bulettes',
  'wyverns',
  'hill giants',
  'frost giants',
  'stone giants',
  'fire giants',
  'ettins',
  'carrion crawlers',
  'doppelgangers',
  'drow',
  'duergar',
  'lizardfolk',
  'sahuagin',
  'merrow',
  'green hags',
  'night hags',
  'sea hags',
  'imps',
  'quasits',
  'dretches',
  'shadows',
  'scarecrows',
  'strahd zombies',
  'dire bats',
  'giant rats',
  'swarms of rats',
  'giant bats',
  'crocodiles',
  'bears',
  'boars',
  'giant frogs',
  'basilisks',
  'cockatrices',
  'griffons',
  'hippogriffs',
  'pegasi',
  'unicorns',
  'dryads',
  'satyrs',
  'pixies',
  'sprites',
  'treants',
  'blink dogs',
  'displacer beasts',
  'phase spiders',
  'young green dragons',
  'green dragons',
  'white dragons',
  'red dragons',
  'blue dragons',
  'black dragons',
  'bronze dragons',
  'copper dragons',
  'gold dragons',
  'silver dragons',
  'brass dragons',
  'dragons',
  'demons',
  'devils',
  'elementals',
  'fire elementals',
  'water elementals',
  'earth elementals',
  'air elementals',
  'liches',
  'death knights',
  'revenants',
  'mongrelfolk',
  'roc',
  'yuan-ti',
  'medusae',
  'minotaurs',
  'cyclopes',
  'chimeras',
  'hydras',
  'krakens',
  'giant octopuses',
  'sharks',
  'awakened trees',
  'shambling mounds',
  'will-o-wisps',
  'shadow mastiffs',
  'hell hounds',
  'nightmares',
  'wererats',
  'werebears',
  'bandit captains',
  'assassins',
  'spies',
  'veterans',
  'thugs',
  'acolytes',
  'cult fanatics',
  'berserkers',
  'gladiators',
  'mages',
  'archmages',
];

const frMonsters = frJob(
  'monsters-fr',
  'portraits/monsters',
  [...new Set(MONSTERS)].map((k) => ({
    name: `Images of ${k}`,
    max: 14,
    tags: ['monster', slugify(k)],
  })),
  { portrait: true, transform: PORTRAIT_TRANSFORM },
);

const PLACES = [
  'taverns',
  'inns',
  'forests',
  'caves',
  'caverns',
  'dungeons',
  'settlements',
  'villages',
  'towns',
  'cities',
  'buildings',
  'fortresses',
  'castles',
  'keeps',
  'towers',
  'mines',
  'sewers',
  'tombs',
  'crypts',
  'graveyards',
  'temples',
  'shrines',
  'ruins',
  'jungles',
  'swamps',
  'marshes',
  'mountains',
  'hills',
  'deserts',
  'coasts',
  'beaches',
  'rivers',
  'lakes',
  'bridges',
  'roads',
  'camps',
  'campfires',
  'markets',
  'docks',
  'harbors',
  'ships',
  'libraries',
  'laboratories',
  'throne rooms',
  'prisons',
  'farms',
  'fields',
  'snow',
  'storms',
  'night',
  'sunsets',
  'battles',
  'Barovia',
  'Castle Ravenloft',
  'Phandalin',
  'Neverwinter',
  'Wave Echo Cave',
  'Cragmaw Castle',
  'Icespire Peak',
  'Leilon',
  'Sword Coast',
  'Vallaki',
  'Krezk',
  'Argynvostholt',
  'Amber Temple',
  'Underdark',
  'landscapes',
];

const frPlaces = frJob(
  'scenes-fr',
  'scenes/fr',
  PLACES.map((k) => ({
    name: `Images of ${k}`,
    max: 40,
    tags: ['scene', slugify(k)],
  })),
  { portrait: false, transform: SCENE_TRANSFORM },
);

// ─── Pathfinder Kingmaker: clean painted PC portraits ───────────────────────

const KINGMAKER_RACE: Record<string, string> = {
  dwarf: 'dwarf',
  elf: 'elf',
  gnome: 'gnome',
  halfelf: 'half-elf',
  halfling: 'halfling',
  halforc: 'half-orc',
  human: 'human',
  aasimar: 'aasimar',
  tiefling: 'tiefling',
  dhampir: 'dhampir',
  kitsune: 'kitsune',
  oread: 'genasi',
  succubus: 'fiend',
  demon: 'fiend',
  devil: 'fiend',
  undead: 'undead',
  lich: 'undead',
  angel: 'celestial',
  azata: 'celestial',
  aeon: 'aberration',
  trickster: 'fey',
  golddragon: 'dragon',
  nogender: 'human',
};

const KINGMAKER_CLASS: Record<string, string> = {
  fighter: 'fighter',
  tank: 'fighter',
  magus: 'fighter',
  barbarian: 'barbarian',
  bloodrager: 'barbarian',
  rogue: 'rogue',
  trapmaster: 'rogue',
  archer: 'ranger',
  ranger: 'ranger',
  cleric: 'cleric',
  priest: 'cleric',
  wizard: 'wizard',
  mage: 'wizard',
  sorcerer: 'sorcerer',
  druid: 'druid',
  monk: 'monk',
  paladin: 'paladin',
  bard: 'bard',
  noble: 'noble',
  alchemist: 'wizard',
  inquisitor: 'paladin',
  kineticist: 'sorcerer',
  slayer: 'ranger',
  hunter: 'ranger',
  warrior: 'fighter',
  knight: 'paladin',
  shaman: 'druid',
  witch: 'warlock',
  oracle: 'cleric',
  warpriest: 'cleric',
  arcanist: 'wizard',
  skald: 'bard',
  cavalier: 'paladin',
  investigator: 'rogue',
  ninja: 'rogue',
  swashbuckler: 'rogue',
  gunslinger: 'ranger',
  summoner: 'sorcerer',
  spiritualist: 'warlock',
  mesmerist: 'bard',
  occultist: 'wizard',
  psychic: 'sorcerer',
  medium: 'cleric',
  vivisectionist: 'rogue',
};

/**
 * Two naming schemes in the category: `DwarfFemaleNoble.png` and
 * `PlayerAasimarMonk01.png` / `PlayerFighter02.png` (race and gender optional).
 */
const kingmakerTags = (title: string): string[] | null => {
  if (/Placeholder|Community/i.test(title)) return null;
  const base = title
    .replace(/\.(png|jpe?g)$/i, '')
    .replace(/^Player/, '')
    .replace(/Artbook$/i, '')
    .replace(/ (Half|Portrait)$/i, '');
  // Split CamelCase: "HalfOrcFemaleTank" → Half, Orc, Female, Tank.
  const raw = base.match(/[A-Z][a-z]+/g) ?? [];
  const tokens: string[] = [];
  for (let k = 0; k < raw.length; k += 1) {
    const t = raw[k] ?? '';
    if (t === 'Half' && raw[k + 1]) {
      tokens.push(`${t}${raw[k + 1]}`);
      k += 1;
    } else {
      tokens.push(t);
    }
  }
  let race: string | undefined;
  let cls: string | undefined;
  let gender: string | undefined;
  for (const t of tokens) {
    const k = t.toLowerCase();
    if (k === 'male' || k === 'female') gender = k;
    else if (KINGMAKER_RACE[k]) race = KINGMAKER_RACE[k];
    else if (KINGMAKER_CLASS[k]) cls = KINGMAKER_CLASS[k];
  }
  // Named companions ("Amiri", "CamelliaArtbook") carry no race in the file
  // name: keep them as NPC-grade portraits without guessing a race.
  const tags: string[] = ['owlcat'];
  if (race) tags.push(race);
  else if (cls || gender) tags.push('human');
  else tags.push('companion');
  if (cls) tags.push(cls);
  if (gender) tags.push(gender);
  if (/Artbook/i.test(title)) tags.push('artbook');
  return tags;
};

const kingmakerPortraits: Job = {
  name: 'portraits-kingmaker',
  site: 'kingmaker',
  apiUrl: KINGMAKER_API,
  outDir: 'portraits/pc',
  categories: [
    { name: 'Portraits - Player', tags: ['portrait', 'pc'] },
    { name: 'Portraits - Companions', tags: ['portrait', 'npc'] },
    { name: 'Portraits - Characters', tags: ['portrait', 'npc'] },
    { name: 'Pathfinder: Kingmaker images - Portraits', tags: ['portrait'] },
    { name: 'Pathfinder: WotR images - Portraits', tags: ['portrait'] },
  ],
  transform: { maxSide: 1100, quality: 82 },
  minWidth: 600,
  tag: (file) => kingmakerTags(file.title),
};

// ─── Wikimedia Commons: public-domain engravings and fairy-tale paintings ───

const commonsJob = (
  name: string,
  outDir: string,
  categories: CategorySpec[],
  extraTags: string[],
): Job => ({
  name,
  site: 'commons',
  apiUrl: COMMONS_API,
  outDir,
  categories,
  transform: { maxSide: 1600, quality: 74 },
  minWidth: 1200,
  requirePublicDomain: true,
  thumbWidth: 1600,
  excludeTitles: /\.(svg|gif|tiff?|pdf|djvu)$/i,
  tag: (file) => {
    if (!/^image\/(jpeg|png|tiff)$/.test(file.info.mime)) return null;
    const artist = file.info.extmetadata?.Artist?.value ?? '';
    const tags = ['scene', 'engraving', ...extraTags];
    if (/Dor[ée]/.test(artist)) tags.push('dore');
    return tags;
  },
  rank: (file) => Math.min(file.info.width, 4000) / 40,
});

const commonsColour = commonsJob(
  'scenes-fairytale',
  'scenes/fairytale',
  [
    { name: 'Works by John Bauer', depth: 1, max: 60, tags: ['bauer'] },
    { name: 'Ivan Bilibin', depth: 1, max: 60, tags: ['bilibin'] },
    {
      name: 'Illustrations by Arthur Rackham',
      depth: 1,
      max: 60,
      tags: ['rackham'],
    },
    { name: 'Kay Nielsen', depth: 1, max: 40, tags: ['nielsen'] },
    { name: 'Paintings by John Martin', max: 30, tags: ['martin'] },
  ],
  ['colour'],
);

const JOBS: Job[] = [
  bg3Items,
  kingmakerPortraits,
  frRaces,
  frNpcs,
  frMonsters,
  frPlaces,
  commonsColour,
];

export { frTrimCats, JOBS, slugify };
export type { CategorySpec, Job, TagContext, Transform };
