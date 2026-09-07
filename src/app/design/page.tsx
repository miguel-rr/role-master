import type { Metadata } from 'next';
import { SectionMark } from '@/components/theme/ornaments';
import {
  artWithTags,
  catalogStats,
  collection,
  findByTitle,
  findItem,
  pickArt,
  sampleArt,
} from '@/data/art/catalog';
import type { ArtEntry } from '@/data/art/schema';
import { DEMO_CHARACTERS } from '@/data/demo/characters';
import { CharacterSheet } from './_components/character-sheet';
import { DiceSection } from './_components/dice-section';
import { Hero } from './_components/hero';
import { InteractionBlocks } from './_components/interaction-blocks';
import { Inventory, type Slot } from './_components/inventory';
import { Passage } from './_components/passage';
import { PortraitLab } from './_components/portrait-lab';
import { StyleGuide } from './_components/style-guide';
import { TacticalBoard, type Token } from './_components/tactical-board';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — Propuestas de diseño',
};

const PLAYER_COLORS = { bram: '#c19429', nissa: '#bdd6e6' } as const;

const RACE_TAGS = [
  'human',
  'elf',
  'dwarf',
  'halfling',
  'gnome',
  'half-elf',
  'half-orc',
  'tiefling',
  'dragonborn',
];

/** Single subject, upright framing and 5e provenance make a better portrait. */
const portraitQuality = (p: ArtEntry) => {
  const races = p.tags.filter((t) => RACE_TAGS.includes(t)).length;
  let q = 0;
  if (races === 1) q += 3;
  if (p.height >= p.width * 0.95) q += 2;
  if (p.tags.includes('5e')) q += 1;
  if (p.source.site === 'kingmaker') q += 4;
  return q;
};

/** First non-empty pool wins. */
const firstOf = (...pools: ArtEntry[][]) =>
  pools.find((p) => p.length > 0) ?? [];

const portraitFor = (
  raceTag: string,
  gender: string,
  classTag: string,
  seed: string,
) =>
  pickArt(
    firstOf(
      artWithTags([raceTag, gender, classTag], {
        within: ['portraits-kingmaker'],
      }),
      artWithTags([raceTag, gender], { within: ['portraits-kingmaker'] }),
      artWithTags([raceTag, gender, classTag], { within: ['portraits-fr'] }),
      artWithTags([raceTag, gender], { within: ['portraits-fr'] }),
      artWithTags([raceTag], {
        within: ['portraits-fr', 'portraits-kingmaker'],
      }),
    ),
    seed,
  );

const sceneFor = (tags: string[][], seed: string) =>
  pickArt(
    firstOf(
      ...tags.map((t) => artWithTags(t, { within: ['scenes-fr'] })),
      collection('scenes-fr'),
      collection('scenes-fairytale'),
      collection('scenes-dore'),
    ),
    seed,
  );

const Section = ({
  id,
  eyebrow,
  title,
  intro,
  children,
  tone = 'dark',
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  tone?: 'dark' | 'darker';
}) => (
  <section
    className={`px-4 py-20 md:px-8 ${tone === 'darker' ? 'bg-charcoal-950/60' : ''}`}
    id={id}
  >
    <SectionMark eyebrow={eyebrow} title={title} />
    <p className="mx-auto mt-5 mb-12 max-w-2xl text-center font-book text-[1.05rem] text-parchment-text leading-relaxed">
      {intro}
    </p>
    {children}
  </section>
);

const DesignPage = () => {
  const [bram, nissa] = DEMO_CHARACTERS;
  if (!bram || !nissa) return null;

  const bramPortrait = portraitFor(
    bram.raceTag,
    bram.gender,
    bram.classTag,
    bram.portraitSeed,
  );
  const nissaPortrait = portraitFor(
    nissa.raceTag,
    nissa.gender,
    nissa.classTag,
    nissa.portraitSeed,
  );

  const heroScene = sceneFor(
    [['mountains'], ['snow'], ['landscapes'], ['fortresses']],
    'hero-1',
  );
  const tavernScene = sceneFor(
    [['taverns'], ['inns'], ['villages'], ['settlements']],
    'tavern-1',
  );
  const innkeeper = pickArt(
    firstOf(
      findByTitle(/innkeep|barkeep|tavern|bartender|publican/i, [
        'npcs-fr',
        'portraits-fr',
      ]),
      artWithTags(['innkeeper'], { within: ['npcs-fr'] }),
      artWithTags(['merchant', 'male'], { within: ['npcs-fr'] }),
      artWithTags(['commoner', 'male'], { within: ['npcs-fr'] }),
      artWithTags(['human', 'male', '5e'], { within: ['npcs-fr'] }),
    ),
    'toblen-1',
  );
  const goblins = sampleArt(
    firstOf(
      artWithTags(['goblin'], { within: ['monsters-fr'] }),
      artWithTags(['goblin']),
    ),
    3,
    'goblins-1',
  );

  const itemArt = new Map<string, ArtEntry | undefined>();
  for (const c of DEMO_CHARACTERS) {
    for (const it of c.inventory) {
      if (!itemArt.has(it.icon)) itemArt.set(it.icon, findItem(it.icon));
    }
  }
  const slotsFor = (id: 'bram' | 'nissa'): Slot[] =>
    (id === 'bram' ? bram : nissa).inventory.map((item) => ({
      item,
      art: itemArt.get(item.icon),
    }));
  const coinArt = {
    gp: findItem('Coin of Mammon'),
    // BG3 has no silver coin icon: the copper pile is desaturated in CSS.
    sp: findItem('Copper Coin Pile'),
    cp: findItem('Copper Coin Pile'),
  };

  const portraits = [
    ...collection('portraits-kingmaker'),
    ...collection('portraits-fr'),
    ...collection('npcs-fr'),
  ]
    .filter((p) => p.width >= 300)
    .sort((a, b) => portraitQuality(b) - portraitQuality(a));

  const players = [
    {
      id: 'bram',
      name: 'Bram',
      color: PLAYER_COLORS.bram,
      portrait: bramPortrait,
    },
    {
      id: 'nissa',
      name: 'Nissa',
      color: PLAYER_COLORS.nissa,
      portrait: nissaPortrait,
    },
  ] as const;

  const tokens: Token[] = [
    {
      id: 'bram',
      name: 'Bram',
      src: bramPortrait?.src,
      kind: 'pc',
      color: PLAYER_COLORS.bram,
      x: 5,
      y: 6,
      speed: 30,
      hp: 9,
      maxHp: 12,
      initiative: 14,
    },
    {
      id: 'nissa',
      name: 'Nissa',
      src: nissaPortrait?.src,
      kind: 'pc',
      color: PLAYER_COLORS.nissa,
      x: 4,
      y: 7,
      speed: 25,
      hp: 9,
      maxHp: 9,
      initiative: 18,
    },
    {
      id: 'g1',
      name: 'Goblin',
      src: goblins[0]?.src,
      kind: 'enemy',
      color: '#e40712',
      x: 12,
      y: 3,
      speed: 30,
      hp: 7,
      maxHp: 7,
      initiative: 12,
    },
    {
      id: 'g2',
      name: 'Goblin',
      src: goblins[1]?.src,
      kind: 'enemy',
      color: '#e40712',
      x: 14,
      y: 7,
      speed: 30,
      hp: 4,
      maxHp: 7,
      initiative: 9,
    },
    {
      id: 'g3',
      name: 'Jefe',
      src: goblins[2]?.src,
      kind: 'enemy',
      color: '#a7080b',
      x: 6,
      y: 3,
      speed: 30,
      hp: 21,
      maxHp: 21,
      initiative: 16,
    },
  ];

  const stats = catalogStats();

  return (
    <main>
      <Hero
        players={[
          {
            name: bram.name,
            role: `${bram.race} · ${bram.className} ${bram.level}`,
            portrait: bramPortrait,
          },
          {
            name: nissa.name,
            role: `${nissa.race} · ${nissa.className} ${nissa.level}`,
            portrait: nissaPortrait,
          },
        ]}
        scene={heroScene}
      />

      <Section
        eyebrow="Propuesta 01"
        id="pasaje"
        intro="Cada turno de narración es una página del manual: ilustración que se funde con el pergamino, capitular, la voz del PNJ con su retrato al margen, la caja de lectura y la tirada que se pide. Debajo, la misma página en registro oscuro para la tele."
        title="El pasaje ilustrado"
      >
        <div className="flex flex-col items-center gap-16">
          <Passage npc={innkeeper} scene={tavernScene} variant="manual" />
          <div className="w-full">
            <div className="mx-auto mb-4 max-w-[52rem] font-condensed text-strapline text-xs uppercase tracking-2xl">
              Variante · lectura en modo TV
            </div>
            <Passage npc={innkeeper} scene={tavernScene} variant="beyond" />
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Propuesta 02"
        id="retratos"
        intro="Arte oficial de Wizards etiquetado por raza, género y clase, más el set de retratos pintados de Kingmaker para elegir cara. El generador saca un personaje completo con nombre y token."
        title="Retratos y generador"
        tone="darker"
      >
        <PortraitLab portraits={portraits} />
      </Section>

      <Section
        eyebrow="Propuesta 03"
        id="inventario"
        intro="Cada objeto tiene su icono pintado, del arco corto a la última moneda de cobre. El anillo de color marca la rareza como en D&D Beyond; el punto granate, lo que llevas puesto."
        title="Inventario ilustrado"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <Inventory
            coinArt={coinArt}
            coins={bram.coins}
            owner={bram.name}
            slots={slotsFor('bram')}
          />
          <Inventory
            coinArt={coinArt}
            coins={nissa.coins}
            owner={nissa.name}
            slots={slotsFor('nissa')}
          />
        </div>
      </Section>

      <Section
        eyebrow="Propuesta 04"
        id="ficha"
        intro="La hoja oficial de 5e, sobre papel, con los dos personajes lado a lado. Los números salen de las reglas, no están escritos a mano: cambia una característica y se recalcula todo."
        title="Las fichas, en papel"
        tone="darker"
      >
        <div className="mx-auto grid max-w-[1600px] gap-8 2xl:grid-cols-2">
          <CharacterSheet
            character={bram}
            itemArt={itemArt}
            portrait={bramPortrait}
          />
          <CharacterSheet
            character={nissa}
            itemArt={itemArt}
            portrait={nissaPortrait}
          />
        </div>
      </Section>

      <Section
        eyebrow="Propuesta 05"
        id="decisiones"
        intro="Nueve formas de pediros que actuéis, para que la mesa no sea siempre la misma pregunta. El narrador elige cuál en cada turno; todas funcionan con los dos delante de una sola pantalla. Son interactivas: probadlas."
        title="Las decisiones"
      >
        <InteractionBlocks players={[players[0], players[1]]} />
      </Section>

      <Section
        eyebrow="Propuesta 06"
        id="tablero"
        intro="Combate en cuadrícula de 5 pies sobre un mapa a tinta. El narrador describe la escena como datos; el tablero la dibuja. Movimiento real por velocidad, terreno difícil, muros que no se atajan, iniciativa y puntos de golpe en los tokens. Mueve a Nissa: es su turno."
        title="El tablero táctico"
        tone="darker"
      >
        <TacticalBoard initialTokens={tokens} />
      </Section>

      <Section
        eyebrow="Propuesta 07"
        id="dados"
        intro="Dados de verdad, con física, que ruedan sobre la bandeja y se leen solos. Un color por jugador, cuatro materiales, ventaja y desventaja resueltas, y los críticos celebrados como merecen."
        title="La bandeja de dados"
      >
        <DiceSection
          players={[
            { id: 'bram', name: 'Bram', color: PLAYER_COLORS.bram },
            { id: 'nissa', name: 'Nissa', color: PLAYER_COLORS.nissa },
          ]}
        />
      </Section>

      <Section
        eyebrow="Sistema"
        id="estilo"
        intro="Los dos registros oficiales, con sus tokens reales. El papel siempre va dentro de la interfaz oscura, nunca al revés."
        title="Color y tipografía"
        tone="darker"
      >
        <StyleGuide />
        <div className="mx-auto mt-10 max-w-7xl font-condensed text-charcoal-500 text-xs uppercase tracking-wider">
          Catálogo de arte:{' '}
          {stats.length === 0
            ? 'vacío (ejecuta pnpm art:sync)'
            : stats.map((s) => `${s.name} ${s.count}`).join(' · ')}
        </div>
      </Section>
    </main>
  );
};

export default DesignPage;
