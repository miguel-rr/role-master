/**
 * Where the library comes from. Every job lists items with a download URL,
 * a licence and tags; the sync script downloads, transcodes, normalises and
 * writes the manifest. Add a job, run `pnpm audio:sync --job <name>`.
 */
import type { SoundLayer, SoundTags } from '../../src/data/sound/schema';

type Item = {
  id: string;
  url: string;
  title: string;
  artist: string;
  license: string;
  page: string;
  layer: SoundLayer;
  tags: SoundTags;
  /** Inside a zip: the file to extract. */
  zipEntry?: string;
  /** Fixed gain tweak in dB after normalisation. */
  gain?: number;
};

type Job = {
  name: string;
  list: () => Promise<Item[]>;
};

const UA = 'role-master/1.0 (private tabletop project)';

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const tags = (t: Partial<SoundTags>): SoundTags => ({
  situations: [],
  moods: [],
  places: [],
  time: [],
  weather: [],
  ...t,
});

// ── Kevin MacLeod (CC BY 4.0) ───────────────────────────────────────────────

type Piece = {
  uuid: string;
  title: string;
  filename: string;
  length: string;
  genre: string;
  description: string;
  feel: string;
  bpm: string;
};

const seconds = (hms: string) => {
  const [h = 0, m = 0, s = 0] = hms.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

/**
 * Rule-based first pass over Kevin MacLeod's ~1400 pieces: genre, feel and
 * description decide the situations. Miguel curates the result later in
 * /design/sound; this only has to be a good shortlist.
 */
const classify = (
  p: Piece,
  genreName: string,
): { situations: string[]; moods: string[] } | null => {
  const feel = p.feel.split(',').map((f) => f.trim());
  const text = `${p.title} ${p.description}`.toLowerCase();
  const has = (...fs: string[]) => fs.some((f) => feel.includes(f));
  const says = (re: RegExp) => re.test(text);
  const len = seconds(p.length);
  if (len < 75 || len > 420) return null;
  if (!['Soundtrack', 'World', 'Classical', 'Horror'].includes(genreName))
    return null;
  if (says(/christmas|holiday|santa|sci-?fi|space|robot|synth|disco|jazz/))
    return null;

  const situations = new Set<string>();
  const moods = new Set<string>();
  if (
    says(
      /tavern|renaissance|ren faire|medieval|lute|jig|reel|celtic|bagpipe|folk|feast|minstrel|court dance|galliard|pavane|bard/,
    )
  ) {
    situations.add(
      has('Bouncy', 'Bright', 'Grooving', 'Humorous') ? 'tavern' : 'court',
    );
    moods.add('warm');
    moods.add('gold');
  }
  if (
    says(/battle|fight|war|charge|combat|armies|assault|siege|clash|conquer/)
  ) {
    situations.add(has('Epic', 'Intense') ? 'combat-heavy' : 'combat-light');
    moods.add('blood');
  }
  if (has('Action', 'Aggressive') && genreName !== 'Horror') {
    situations.add('combat-light');
    situations.add('chase');
    moods.add('blood');
  }
  if (has('Epic')) {
    situations.add('boss');
    situations.add('victory');
    moods.add('gold');
  }
  if (has('Dark', 'Eerie', 'Unnerving') || genreName === 'Horror') {
    situations.add(has('Suspenseful', 'Intense') ? 'tension' : 'mystery');
    moods.add('dark');
  }
  if (has('Suspenseful')) {
    situations.add('stealth');
    situations.add('tension');
    moods.add('dark');
  }
  if (has('Mysterious', 'Mystical')) {
    situations.add('exploration');
    situations.add('mystery');
    moods.add('cold');
    moods.add('green');
  }
  if (has('Somber')) {
    situations.add('sorrow');
    moods.add('cold');
  }
  if (has('Calm', 'Calming', 'Relaxed') && !has('Grooving', 'Bouncy')) {
    situations.add('rest');
    situations.add('travel');
    moods.add('warm');
    moods.add('green');
  }
  if (
    has('Uplifting', 'Bright') &&
    genreName !== 'Horror' &&
    !has('Grooving')
  ) {
    situations.add('arrival');
    situations.add('epilogue');
    moods.add('gold');
  }
  if (
    says(/ritual|chant|choir|monk|hymn|temple|sacred|ossuary|dirge|requiem/)
  ) {
    situations.add('ritual');
    moods.add('dark');
  }
  if (situations.size === 0) return null;
  return { situations: [...situations], moods: [...moods] };
};

/** Titles Miguel or the team already know work; always in, whatever the rules say. */
const INCOMPETECH_PICKS: Record<string, string[]> = {
  tavern: [
    'Folk Round',
    'Master of the Feast',
    'Achaidh Cheide',
    'Teller of the Tales',
    'The Britons',
    'Skye Cuillin',
    'Celtic Impulse',
    'Minstrel Guild',
  ],
  court: [
    'Angevin',
    'Lord of the Land',
    'Pippin the Hunchback',
    'Suonatore di Liuto',
    'Rondo Brothers',
  ],
  exploration: [
    'Virtutes Instrumenti',
    'Lightless Dawn',
    'Ancient Rite',
    'Crossing the Chasm',
    'Sunday Dub',
  ],
  travel: [
    'Wanderer',
    'Clash Defiant',
    'Frost Waltz',
    'Immersed',
    'Long Road Ahead',
    'Ranz des Vaches',
  ],
  tension: [
    'Long Note Two',
    'Long Note One',
    'Dark Fog',
    'Anxiety',
    'Ossuary 1 - A Beginning',
    'The Descent',
  ],
  mystery: [
    'Mystery Bazaar',
    'Night Cave',
    'Enchanted Valley',
    'Ossuary 6 - Air',
    'Shadowlands 4 - Breath',
  ],
  'combat-light': [
    'Heavy Interlude',
    'Volatile Reaction',
    'Ropocalypse 2',
    'Crusade',
    'Take a Chance',
  ],
  'combat-heavy': [
    'Five Armies',
    'Curse of the Scarab',
    'Killers',
    'Final Battle of the Dark Wizards',
    'Hitman',
  ],
  boss: [
    'Dragon and Toast',
    'Black Vortex',
    'Crypto',
    'Darkest Child',
    'Crossing the Divide',
  ],
  sorrow: [
    'Immersed',
    'Heartbreaking',
    'Ossuary 5 - Rest',
    'Sad Trio',
    'Long Note Four',
    'Interloper',
  ],
  rest: [
    'Dreams Become Real',
    'Peaceful Desolation',
    'Meditation Impromptu 01',
    'Fireflies and Stardust',
    'Gymnopedie No 1',
  ],
  ritual: [
    'Ancient Rite',
    'Ossuary 2 - Turn',
    'Shadowlands 1 - Horizon',
    'Dhaka',
    'Temple of the Manes',
  ],
  victory: [
    'Achievement',
    'Heroic Age',
    'Truth of the Legend',
    'Rising Game',
    'Return of the Mummy',
  ],
  arrival: [
    'Adventure Meme',
    'Fantasia Fantasia',
    'Hidden Agenda',
    'Sneaky Snitch',
  ],
  epilogue: [
    'Kalimba Relaxation Music',
    'Wind of the Rainforest',
    'Almost New',
    'Daydream',
  ],
};

const incompetech: Job = {
  name: 'incompetech',
  list: async () => {
    const base = 'https://incompetech.com/music/royalty-free/';
    const [pieces, genres] = await Promise.all([
      fetch(`${base}pieces.json`, { headers: { 'user-agent': UA } }).then(
        (r) => r.json() as Promise<Piece[]>,
      ),
      fetch(`${base}genre.json`, { headers: { 'user-agent': UA } }).then(
        (r) => r.json() as Promise<{ id: number; genre: string }[]>,
      ),
    ]);
    const genreOf = new Map(genres.map((g) => [String(g.id), g.genre]));
    const wanted = new Map<string, string[]>();
    for (const [situation, titles] of Object.entries(INCOMPETECH_PICKS))
      for (const t of titles)
        wanted.set(t.toLowerCase(), [
          ...(wanted.get(t.toLowerCase()) ?? []),
          situation,
        ]);
    const items: Item[] = [];
    const perSituation = new Map<string, number>();
    const CAP = 10;
    // Hand picks first, then the rules fill each situation up to the cap.
    const sorted = [...pieces].sort(
      (a, b) =>
        Number(wanted.has(b.title.toLowerCase())) -
        Number(wanted.has(a.title.toLowerCase())),
    );
    for (const p of sorted) {
      const genreName = genreOf.get(p.genre) ?? '';
      const picked = wanted.get(p.title.toLowerCase());
      const auto = classify(p, genreName);
      const situations = picked ?? auto?.situations ?? [];
      if (situations.length === 0) continue;
      if (!picked) {
        const room = situations.filter((s) => (perSituation.get(s) ?? 0) < CAP);
        if (room.length === 0) continue;
      }
      for (const s of situations)
        perSituation.set(s, (perSituation.get(s) ?? 0) + 1);
      items.push({
        id: `music/km-${slug(p.title)}`,
        url: `${base}mp3-royaltyfree/${encodeURIComponent(p.filename)}`,
        title: p.title,
        artist: 'Kevin MacLeod (incompetech.com)',
        license: 'CC BY 4.0',
        page: 'https://incompetech.com/music/royalty-free/music.html',
        layer: 'music',
        tags: tags({ situations, moods: auto?.moods ?? [] }),
      });
    }
    return items;
  },
};

// ── OpenGameArt (per page, licence read from the page) ──────────────────────

type OgaPick = {
  page: string;
  /** Substring of the file name to pick; first non-preview file otherwise. */
  file?: string;
  id: string;
  title: string;
  layer: SoundLayer;
  tags: SoundTags;
  gain?: number;
};

const OGA_PICKS: OgaPick[] = [
  {
    page: 'forest-ambience',
    id: 'bed/forest-day',
    title: 'Forest Ambience',
    layer: 'bed',
    tags: tags({ places: ['forest', 'road', 'farm', 'mill'], time: ['day'] }),
  },
  {
    page: 'loopable-dungeon-ambience',
    id: 'bed/dungeon-drone',
    title: 'Loopable Dungeon Ambience',
    layer: 'bed',
    tags: tags({
      places: ['dungeon', 'cave', 'mine', 'sewer', 'underdark', 'ruins'],
    }),
  },
  {
    page: 'dungeon-ambience',
    id: 'bed/dungeon-drips',
    title: 'Dungeon Ambience',
    layer: 'bed',
    tags: tags({ places: ['dungeon', 'cave', 'mine', 'sewer'] }),
  },
  {
    page: 'forgoten-tomb-ambience',
    file: 'Forgoten_tombs_1',
    id: 'bed/tomb',
    title: 'Forgotten Tomb Ambience',
    layer: 'bed',
    tags: tags({
      places: ['graveyard', 'ruins', 'dungeon', 'temple'],
      moods: ['dark'],
    }),
  },
  {
    page: 'fireplace-sound-loop',
    id: 'bed/fireplace',
    title: 'Fireplace Loop',
    layer: 'bed',
    tags: tags({ places: ['tavern', 'inn-night', 'camp', 'interior', 'farm'] }),
  },
  {
    page: 'crickets-ambient-noise-loopable',
    file: 'crickets-oneloop',
    id: 'bed/crickets',
    title: 'Crickets (loop)',
    layer: 'bed',
    tags: tags({
      places: [
        'forest',
        'road',
        'camp',
        'farm',
        'swamp',
        'lake',
        'river',
        'mill',
      ],
      time: ['night'],
    }),
  },
  {
    page: 'crowd-shoutingspeaking-ambience',
    id: 'bed/crowd-murmur',
    title: 'Crowd Speaking Ambience',
    layer: 'bed',
    tags: tags({ places: ['tavern', 'market', 'town-day', 'harbour'] }),
    gain: -4,
  },
  {
    page: 'the-messy-feast',
    id: 'bed/feast',
    title: 'The Messy Feast',
    layer: 'bed',
    tags: tags({ places: ['tavern', 'palace'] }),
    gain: -6,
  },
  {
    page: 'thunder-lightning-ambience-field-recording',
    id: 'bed/thunderstorm',
    title: 'Thunder Ambience',
    layer: 'bed',
    tags: tags({ places: [], weather: ['storm'] }),
  },
  {
    page: 'jc-sounds-nature-ambient-pack-vol-1',
    id: 'bed/nature-mix',
    title: 'Nature Ambient Pack Vol. 1',
    layer: 'bed',
    tags: tags({ places: ['forest', 'river', 'lake', 'road'], time: ['day'] }),
  },
];

const LICENSE_NAMES: [RegExp, string][] = [
  [/publicdomain\/zero/, 'CC0 1.0'],
  [/licenses\/by-sa\/4/, 'CC BY-SA 4.0'],
  [/licenses\/by-sa\/3/, 'CC BY-SA 3.0'],
  [/licenses\/by\/4/, 'CC BY 4.0'],
  [/licenses\/by\/3/, 'CC BY 3.0'],
  [/licenses\/by(?!-)/, 'CC BY'],
  [/oga-by-30/, 'OGA-BY 3.0'],
];

const oga: Job = {
  name: 'oga',
  list: async () => {
    const items: Item[] = [];
    for (const pick of OGA_PICKS) {
      const page = `https://opengameart.org/content/${pick.page}`;
      const html = await fetch(page, { headers: { 'user-agent': UA } }).then(
        (r) => r.text(),
      );
      const files = [
        ...html.matchAll(
          /https:\/\/opengameart\.org\/sites\/default\/files\/[^"'<\s]+\.(?:ogg|mp3|wav|flac)/g,
        ),
      ]
        .map((m) => m[0])
        .filter((u) => !u.includes('/styles/') && !u.includes('audio_preview'));
      const file =
        (pick.file
          ? files.find((u) => u.includes(pick.file ?? ''))
          : undefined) ?? files[0];
      if (!file) {
        console.warn(`oga: sin fichero en ${page}`);
        continue;
      }
      const license =
        LICENSE_NAMES.find(([re]) => re.test(html))?.[1] ?? 'ver página';
      const author =
        /<a href="\/users\/[^"]+"[^>]*>([^<]+)<\/a>/.exec(html)?.[1] ??
        'OpenGameArt';
      items.push({
        id: pick.id,
        url: file,
        title: pick.title,
        artist: author,
        license,
        page,
        layer: pick.layer,
        tags: pick.tags,
        gain: pick.gain,
      });
    }
    return items;
  },
};

// ── Kenney (CC0): interface and RPG foley from zips ─────────────────────────

type KenneyPack = {
  slug: string;
  picks: {
    match: RegExp;
    id: string;
    title: string;
    layer: SoundLayer;
    cue: string;
    gain?: number;
  }[];
};

const KENNEY_PACKS: KenneyPack[] = [
  {
    slug: 'ui-audio',
    picks: [
      {
        match: /\/click1\.ogg$/,
        id: 'ui/click',
        title: 'Click',
        layer: 'ui',
        cue: 'choice',
      },
      {
        match: /\/switch2\.ogg$/,
        id: 'ui/switch',
        title: 'Switch',
        layer: 'ui',
        cue: 'open-sheet',
      },
      {
        match: /\/switch3\.ogg$/,
        id: 'ui/switch-back',
        title: 'Switch back',
        layer: 'ui',
        cue: 'close-sheet',
      },
      {
        match: /\/rollover2\.ogg$/,
        id: 'ui/rollover',
        title: 'Rollover',
        layer: 'ui',
        cue: 'item-card',
      },
    ],
  },
  {
    slug: 'rpg-audio',
    picks: [
      {
        match: /bookFlip2\.ogg$/,
        id: 'ui/page-turn',
        title: 'Page turn',
        layer: 'ui',
        cue: 'page-turn',
      },
      {
        match: /bookClose\.ogg$/,
        id: 'sfx/book-close',
        title: 'Book close',
        layer: 'sfx',
        cue: 'book-close',
      },
      {
        match: /doorOpen_1\.ogg$/,
        id: 'sfx/door-wood-open',
        title: 'Door open',
        layer: 'sfx',
        cue: 'door-wood-open',
      },
      {
        match: /doorClose_1\.ogg$/,
        id: 'sfx/door-wood-close',
        title: 'Door close',
        layer: 'sfx',
        cue: 'door-wood-close',
      },
      {
        match: /metalLatch\.ogg$/,
        id: 'sfx/lock',
        title: 'Latch',
        layer: 'sfx',
        cue: 'lock',
      },
      {
        match: /handleCoins\.ogg$/,
        id: 'sfx/coins-pour',
        title: 'Coins',
        layer: 'sfx',
        cue: 'coins-pour',
      },
      {
        match: /handleCoins2\.ogg$/,
        id: 'sfx/coin',
        title: 'Coin',
        layer: 'sfx',
        cue: 'coin',
      },
      {
        match: /drawKnife1\.ogg$/,
        id: 'sfx/sword-draw',
        title: 'Blade drawn',
        layer: 'sfx',
        cue: 'sword-draw',
      },
      {
        match: /knifeSlice\.ogg$/,
        id: 'sfx/sword-clash',
        title: 'Blade',
        layer: 'sfx',
        cue: 'sword-clash',
      },
      {
        match: /footstep00\.ogg$/,
        id: 'sfx/footsteps-stone',
        title: 'Footstep',
        layer: 'sfx',
        cue: 'footsteps-stone',
      },
      {
        match: /creak1\.ogg$/,
        id: 'sfx/footsteps-wood',
        title: 'Creak',
        layer: 'sfx',
        cue: 'footsteps-wood',
      },
      {
        match: /chop\.ogg$/,
        id: 'sfx/impact',
        title: 'Chop',
        layer: 'sfx',
        cue: 'impact',
      },
      {
        match: /dropLeather\.ogg$/,
        id: 'sfx/body-fall',
        title: 'Drop',
        layer: 'sfx',
        cue: 'body-fall',
      },
      {
        match: /metalPot1\.ogg$/,
        id: 'sfx/mug',
        title: 'Pot',
        layer: 'sfx',
        cue: 'mug',
      },
      {
        match: /cloth1\.ogg$/,
        id: 'sfx/parchment',
        title: 'Cloth',
        layer: 'sfx',
        cue: 'parchment',
      },
      {
        match: /beltHandle1\.ogg$/,
        id: 'ui/dice-rattle',
        title: 'Rattle',
        layer: 'ui',
        cue: 'dice-rattle',
      },
      {
        match: /metalClick\.ogg$/,
        id: 'ui/dice-land',
        title: 'Land',
        layer: 'ui',
        cue: 'dice-land',
      },
    ],
  },
  {
    slug: 'impact-sounds',
    picks: [
      {
        match: /impactBell_heavy_000\.ogg$/,
        id: 'sfx/bell',
        title: 'Bell',
        layer: 'sfx',
        cue: 'bell',
      },
      {
        match: /impactMetal_heavy_000\.ogg$/,
        id: 'sfx/gong',
        title: 'Metal heavy',
        layer: 'sfx',
        cue: 'gong',
      },
      {
        match: /impactGlass_heavy_000\.ogg$/,
        id: 'sfx/glass-break',
        title: 'Glass',
        layer: 'sfx',
        cue: 'glass-break',
      },
      {
        match: /impactWood_heavy_000\.ogg$/,
        id: 'sfx/rockfall',
        title: 'Wood heavy',
        layer: 'sfx',
        cue: 'rockfall',
      },
      {
        match: /impactPlate_heavy_000\.ogg$/,
        id: 'sfx/door-iron',
        title: 'Plate heavy',
        layer: 'sfx',
        cue: 'door-iron',
      },
      {
        match: /impactMining_000\.ogg$/,
        id: 'sfx/chain',
        title: 'Mining',
        layer: 'sfx',
        cue: 'chain',
      },
      {
        match: /impactPunch_heavy_000\.ogg$/,
        id: 'ui/fumble',
        title: 'Punch',
        layer: 'ui',
        cue: 'fumble',
      },
    ],
  },
  {
    slug: 'interface-sounds',
    picks: [
      {
        match: /confirmation_001\.ogg$/,
        id: 'ui/crit',
        title: 'Confirmation',
        layer: 'ui',
        cue: 'crit',
      },
      {
        match: /maximize_006\.ogg$/,
        id: 'ui/reveal',
        title: 'Maximize',
        layer: 'ui',
        cue: 'reveal',
      },
      {
        match: /glass_002\.ogg$/,
        id: 'ui/soundcheck',
        title: 'Glass',
        layer: 'ui',
        cue: 'soundcheck',
      },
    ],
  },
];

const kenney: Job = {
  name: 'kenney',
  list: async () => {
    const items: Item[] = [];
    for (const pack of KENNEY_PACKS) {
      const page = `https://kenney.nl/assets/${pack.slug}`;
      const html = await fetch(page, { headers: { 'user-agent': UA } }).then(
        (r) => r.text(),
      );
      const url = new RegExp(
        `https://kenney\\.nl/media/pages/assets/${pack.slug}/[0-9a-f]+-\\d+/kenney_${pack.slug}\\.zip`,
      ).exec(html)?.[0];
      if (!url) {
        console.warn(`kenney: no encuentro el paquete ${pack.slug}`);
        continue;
      }
      for (const p of pack.picks) {
        items.push({
          id: p.id,
          url,
          zipEntry: p.match.source,
          title: p.title,
          artist: 'Kenney (kenney.nl)',
          license: 'CC0 1.0',
          page,
          layer: p.layer,
          tags: tags({ cue: p.cue }),
          gain: p.gain,
        });
      }
    }
    return items;
  },
};

// ── Freesound (CC0 via API; needs FREESOUND_API_KEY) ────────────────────────

type FreesoundQuery = {
  id: string;
  query: string;
  layer: SoundLayer;
  tags: SoundTags;
  /** Seconds. */
  duration: [number, number];
  count: number;
  extraFilter?: string;
};

const FREESOUND_QUERIES: FreesoundQuery[] = [
  {
    id: 'bed/tavern',
    query: 'tavern ambience crowd medieval',
    layer: 'bed',
    tags: tags({ places: ['tavern', 'inn-night'] }),
    duration: [45, 240],
    count: 3,
  },
  {
    id: 'bed/market',
    query: 'medieval market crowd ambience',
    layer: 'bed',
    tags: tags({ places: ['market', 'town-day'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'bed/forest-night',
    query: 'forest night ambience owls crickets',
    layer: 'bed',
    tags: tags({ places: ['forest', 'road', 'camp'], time: ['night'] }),
    duration: [45, 240],
    count: 3,
  },
  {
    id: 'bed/forest-day',
    query: 'forest birds ambience loop',
    layer: 'bed',
    tags: tags({ places: ['forest', 'road', 'farm'], time: ['day'] }),
    duration: [45, 240],
    count: 3,
  },
  {
    id: 'bed/rain',
    query: 'rain ambience loop',
    layer: 'bed',
    tags: tags({ weather: ['rain'] }),
    duration: [45, 240],
    count: 3,
  },
  {
    id: 'bed/wind-mountain',
    query: 'mountain wind ambience',
    layer: 'bed',
    tags: tags({ places: ['mountain', 'snow'], weather: ['wind'] }),
    duration: [45, 240],
    count: 3,
  },
  {
    id: 'bed/blizzard',
    query: 'blizzard snow wind ambience',
    layer: 'bed',
    tags: tags({ places: ['snow'], weather: ['snow'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'bed/cave',
    query: 'cave ambience drips echo',
    layer: 'bed',
    tags: tags({ places: ['cave', 'mine', 'underdark'] }),
    duration: [45, 240],
    count: 3,
  },
  {
    id: 'bed/river',
    query: 'river stream ambience',
    layer: 'bed',
    tags: tags({ places: ['river', 'lake', 'mill'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'bed/swamp',
    query: 'swamp ambience frogs insects',
    layer: 'bed',
    tags: tags({ places: ['swamp'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'bed/harbour',
    query: 'harbour seagulls waves ambience',
    layer: 'bed',
    tags: tags({ places: ['harbour', 'ship'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'bed/ship',
    query: 'ship creaking wood waves',
    layer: 'bed',
    tags: tags({ places: ['ship'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'bed/temple',
    query: 'church interior ambience reverb',
    layer: 'bed',
    tags: tags({ places: ['temple', 'palace', 'library'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'bed/desert-wind',
    query: 'desert wind ambience',
    layer: 'bed',
    tags: tags({ places: ['desert'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'bed/camp-night',
    query: 'campfire night crickets ambience',
    layer: 'bed',
    tags: tags({ places: ['camp'], time: ['night'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'bed/town-day',
    query: 'village ambience birds distant voices',
    layer: 'bed',
    tags: tags({ places: ['town-day', 'farm'], time: ['day'] }),
    duration: [45, 240],
    count: 2,
  },
  {
    id: 'spot/owl',
    query: 'owl hoot',
    layer: 'spot',
    tags: tags({ places: ['forest', 'road', 'camp', 'farm'], time: ['night'] }),
    duration: [1, 8],
    count: 3,
  },
  {
    id: 'spot/wolf-howl',
    query: 'wolf howl distant',
    layer: 'spot',
    tags: tags({
      places: ['forest', 'mountain', 'snow', 'road'],
      time: ['night'],
    }),
    duration: [2, 10],
    count: 2,
  },
  {
    id: 'spot/crow',
    query: 'crow caw',
    layer: 'spot',
    tags: tags({
      places: ['graveyard', 'ruins', 'road', 'farm'],
      time: ['day'],
    }),
    duration: [1, 6],
    count: 3,
  },
  {
    id: 'spot/laugh',
    query: 'man laugh short',
    layer: 'spot',
    tags: tags({ places: ['tavern', 'market'] }),
    duration: [1, 5],
    count: 3,
  },
  {
    id: 'spot/mug-clink',
    query: 'mug clink glass toast',
    layer: 'spot',
    tags: tags({ places: ['tavern'] }),
    duration: [0.5, 4],
    count: 3,
  },
  {
    id: 'spot/drip',
    query: 'water drip cave single',
    layer: 'spot',
    tags: tags({ places: ['cave', 'dungeon', 'mine', 'sewer', 'underdark'] }),
    duration: [0.5, 4],
    count: 3,
  },
  {
    id: 'spot/bats',
    query: 'bats flapping cave',
    layer: 'spot',
    tags: tags({ places: ['cave', 'dungeon', 'ruins'] }),
    duration: [1, 6],
    count: 2,
  },
  {
    id: 'spot/thunder-far',
    query: 'distant thunder rumble',
    layer: 'spot',
    tags: tags({ weather: ['rain', 'storm'] }),
    duration: [2, 10],
    count: 3,
  },
  {
    id: 'spot/wind-gust',
    query: 'wind gust single',
    layer: 'spot',
    tags: tags({ places: ['mountain', 'snow', 'road', 'desert', 'ruins'] }),
    duration: [2, 10],
    count: 3,
  },
  {
    id: 'spot/seagull',
    query: 'seagull cry',
    layer: 'spot',
    tags: tags({ places: ['harbour', 'ship'] }),
    duration: [1, 6],
    count: 2,
  },
  {
    id: 'spot/dog-bark',
    query: 'dog bark distant',
    layer: 'spot',
    tags: tags({ places: ['town-day', 'farm', 'market'] }),
    duration: [1, 6],
    count: 2,
  },
  {
    id: 'spot/bell-distant',
    query: 'church bell distant',
    layer: 'spot',
    tags: tags({ places: ['town-day', 'temple', 'harbour'] }),
    duration: [2, 12],
    count: 2,
  },
  {
    id: 'spot/horse',
    query: 'horse neigh',
    layer: 'spot',
    tags: tags({ places: ['road', 'town-day', 'market', 'farm'] }),
    duration: [1, 6],
    count: 2,
  },
  {
    id: 'spot/fire-crackle',
    query: 'fire crackle pop',
    layer: 'spot',
    tags: tags({ places: ['tavern', 'camp', 'interior', 'inn-night'] }),
    duration: [1, 6],
    count: 2,
  },
  {
    id: 'spot/creak',
    query: 'wood creak house',
    layer: 'spot',
    tags: tags({ places: ['inn-night', 'interior', 'mill', 'ship'] }),
    duration: [0.5, 5],
    count: 3,
  },
  {
    id: 'spot/birds',
    query: 'songbird chirp single',
    layer: 'spot',
    tags: tags({
      places: ['forest', 'farm', 'town-day', 'road'],
      time: ['day'],
    }),
    duration: [1, 6],
    count: 3,
  },
  {
    id: 'sfx/thunder',
    query: 'thunder crack close',
    layer: 'sfx',
    tags: tags({ cue: 'thunder' }),
    duration: [2, 12],
    count: 2,
  },
  {
    id: 'sfx/roar',
    query: 'monster roar',
    layer: 'sfx',
    tags: tags({ cue: 'roar' }),
    duration: [1, 6],
    count: 2,
  },
  {
    id: 'sfx/growl',
    query: 'creature growl',
    layer: 'sfx',
    tags: tags({ cue: 'growl' }),
    duration: [1, 6],
    count: 2,
  },
  {
    id: 'sfx/wings',
    query: 'large wings flap',
    layer: 'sfx',
    tags: tags({ cue: 'wings' }),
    duration: [1, 6],
    count: 2,
  },
  {
    id: 'sfx/arrow',
    query: 'arrow whoosh impact',
    layer: 'sfx',
    tags: tags({ cue: 'arrow' }),
    duration: [0.5, 4],
    count: 2,
  },
  {
    id: 'sfx/bow-draw',
    query: 'bow string draw',
    layer: 'sfx',
    tags: tags({ cue: 'bow-draw' }),
    duration: [0.5, 4],
    count: 1,
  },
  {
    id: 'sfx/sword-clash',
    query: 'sword clash metal',
    layer: 'sfx',
    tags: tags({ cue: 'sword-clash' }),
    duration: [0.5, 4],
    count: 2,
  },
  {
    id: 'sfx/fire-ignite',
    query: 'fire ignite whoosh',
    layer: 'sfx',
    tags: tags({ cue: 'fire-ignite' }),
    duration: [0.5, 4],
    count: 2,
  },
  {
    id: 'sfx/torch',
    query: 'torch flame loop',
    layer: 'sfx',
    tags: tags({ cue: 'torch' }),
    duration: [1, 8],
    count: 1,
  },
  {
    id: 'sfx/candle-out',
    query: 'candle blow out',
    layer: 'sfx',
    tags: tags({ cue: 'candle-out' }),
    duration: [0.5, 4],
    count: 1,
  },
  {
    id: 'sfx/wind-gust',
    query: 'strong wind gust',
    layer: 'sfx',
    tags: tags({ cue: 'wind-gust' }),
    duration: [2, 10],
    count: 1,
  },
  {
    id: 'sfx/crow',
    query: 'crow caw close',
    layer: 'sfx',
    tags: tags({ cue: 'crow' }),
    duration: [1, 5],
    count: 1,
  },
  {
    id: 'sfx/wolf',
    query: 'wolf howl',
    layer: 'sfx',
    tags: tags({ cue: 'wolf' }),
    duration: [2, 10],
    count: 1,
  },
  {
    id: 'sfx/owl',
    query: 'owl hoot close',
    layer: 'sfx',
    tags: tags({ cue: 'owl' }),
    duration: [1, 6],
    count: 1,
  },
  {
    id: 'sfx/scream-far',
    query: 'distant scream',
    layer: 'sfx',
    tags: tags({ cue: 'scream-far' }),
    duration: [1, 6],
    count: 1,
  },
  {
    id: 'sfx/laugh',
    query: 'hearty laugh',
    layer: 'sfx',
    tags: tags({ cue: 'laugh' }),
    duration: [1, 6],
    count: 1,
  },
  {
    id: 'sfx/applause',
    query: 'small crowd applause',
    layer: 'sfx',
    tags: tags({ cue: 'applause' }),
    duration: [2, 10],
    count: 1,
  },
  {
    id: 'sfx/water-drip',
    query: 'water drip echo',
    layer: 'sfx',
    tags: tags({ cue: 'water-drip' }),
    duration: [0.5, 5],
    count: 1,
  },
  {
    id: 'sfx/splash',
    query: 'water splash',
    layer: 'sfx',
    tags: tags({ cue: 'splash' }),
    duration: [0.5, 4],
    count: 1,
  },
  {
    id: 'sfx/spell',
    query: 'magic spell cast whoosh',
    layer: 'sfx',
    tags: tags({ cue: 'spell' }),
    duration: [0.5, 5],
    count: 2,
  },
  {
    id: 'sfx/heal',
    query: 'healing magic chime',
    layer: 'sfx',
    tags: tags({ cue: 'heal' }),
    duration: [0.5, 5],
    count: 1,
  },
  {
    id: 'sfx/arcane-spark',
    query: 'magic spark shimmer',
    layer: 'sfx',
    tags: tags({ cue: 'arcane-spark' }),
    duration: [0.5, 4],
    count: 1,
  },
  {
    id: 'sfx/heartbeat',
    query: 'heartbeat loop',
    layer: 'sfx',
    tags: tags({ cue: 'heartbeat' }),
    duration: [2, 20],
    count: 1,
  },
  {
    id: 'sfx/gong',
    query: 'gong hit',
    layer: 'sfx',
    tags: tags({ cue: 'gong' }),
    duration: [2, 12],
    count: 1,
  },
  {
    id: 'sfx/bell',
    query: 'church bell single toll',
    layer: 'sfx',
    tags: tags({ cue: 'bell' }),
    duration: [2, 10],
    count: 1,
  },
  {
    id: 'sfx/rockfall',
    query: 'rocks falling rumble',
    layer: 'sfx',
    tags: tags({ cue: 'rockfall' }),
    duration: [1, 8],
    count: 1,
  },
  {
    id: 'sfx/chain',
    query: 'chain rattle',
    layer: 'sfx',
    tags: tags({ cue: 'chain' }),
    duration: [0.5, 5],
    count: 1,
  },
  {
    id: 'sfx/door-iron',
    query: 'iron gate creak',
    layer: 'sfx',
    tags: tags({ cue: 'door-iron' }),
    duration: [1, 6],
    count: 1,
  },
  {
    id: 'sfx/glass-break',
    query: 'glass shatter',
    layer: 'sfx',
    tags: tags({ cue: 'glass-break' }),
    duration: [0.5, 4],
    count: 1,
  },
  {
    id: 'sfx/body-fall',
    query: 'body fall thud',
    layer: 'sfx',
    tags: tags({ cue: 'body-fall' }),
    duration: [0.5, 4],
    count: 1,
  },
  {
    id: 'sfx/impact',
    query: 'heavy punch impact',
    layer: 'sfx',
    tags: tags({ cue: 'impact' }),
    duration: [0.3, 3],
    count: 1,
  },
];

const freesound: Job = {
  name: 'freesound',
  list: async () => {
    const key = process.env.FREESOUND_API_KEY;
    if (!key) {
      console.warn('freesound: falta FREESOUND_API_KEY; trabajo omitido');
      return [];
    }
    const items: Item[] = [];
    for (const q of FREESOUND_QUERIES) {
      const params = new URLSearchParams({
        query: q.query,
        filter:
          `license:"Creative Commons 0" duration:[${q.duration[0]} TO ${q.duration[1]}] ${q.extraFilter ?? ''}`.trim(),
        sort: 'rating_desc',
        fields:
          'id,name,username,license,previews,duration,avg_rating,num_ratings,tags,url',
        page_size: '15',
        token: key,
      });
      const res = await fetch(
        `https://freesound.org/apiv2/search/text/?${params}`,
        { headers: { 'user-agent': UA } },
      );
      if (!res.ok) {
        console.warn(`freesound: ${q.query} → ${res.status}`);
        continue;
      }
      const data = (await res.json()) as {
        results: {
          id: number;
          name: string;
          username: string;
          previews: Record<string, string>;
          duration: number;
          avg_rating: number;
          num_ratings: number;
          url: string;
        }[];
      };
      const good = data.results
        .filter((r) => r.num_ratings >= 2 || data.results.length < 5)
        .slice(0, q.count);
      good.forEach((r, i) => {
        items.push({
          id: `${q.id}-${i + 1}`,
          url:
            r.previews['preview-hq-ogg'] ?? r.previews['preview-hq-mp3'] ?? '',
          title: r.name.replace(/\.[a-z0-9]+$/i, ''),
          artist: `${r.username} (freesound.org)`,
          license: 'CC0 1.0',
          page: r.url,
          layer: q.layer,
          tags: q.tags,
        });
      });
      await new Promise((r) => setTimeout(r, 1100)); // 60 requests/minute
    }
    return items.filter((i) => i.url);
  },
};

const JOBS: Job[] = [incompetech, oga, kenney, freesound];

export { JOBS };
export type { Item, Job };
