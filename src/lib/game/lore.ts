import { ICESPIRE_LORE, type LoreSeed } from '@/data/campaigns/icespire-lore';
import { presetById } from '@/data/characters/presets';

/**
 * The table's memory of names: who and what the players have met, where
 * they read about it first, and what they have learnt since. Seeded from the
 * introduction and the chosen characters' backstories; grown every turn from
 * the narrator's notes.
 */

const LORE_KINDS = [
  'character',
  'place',
  'creature',
  'faction',
  'item',
  'garment',
  'concept',
] as const;

type LoreKind = (typeof LORE_KINDS)[number];

const LORE_KIND_LABEL: Record<LoreKind, string> = {
  character: 'Personajes',
  place: 'Lugares',
  creature: 'Criaturas',
  faction: 'Facciones',
  item: 'Objetos',
  garment: 'Prendas',
  concept: 'Nociones',
};

type LoreEvent = { turn: number; text: string };

type LoreEntry = {
  id: string;
  name: string;
  kind: LoreKind;
  aliases: string[];
  summary: string;
  /** Where the players first read about it. */
  firstSeen: { source: string; label: string; turn: number };
  events: LoreEvent[];
};

type LoreNote = { kind: LoreKind; name: string; text: string };

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const LORE_SEEDS: Record<string, LoreSeed[]> = {
  'icespire-act1': ICESPIRE_LORE,
};

/** The glossary a new game starts with: introduction plus the party's stories. */
const seedLore = (
  campaignId: string,
  players: { name: string; characterId: string }[],
): LoreEntry[] => {
  const seeds = LORE_SEEDS[campaignId] ?? [];
  const chosen = new Set(players.map((p) => p.characterId));
  const entries: LoreEntry[] = players.flatMap((p) => {
    const c = presetById(p.characterId);
    if (!c) return [];
    return [
      {
        id: `pc-${c.id}`,
        name: c.name,
        kind: 'character' as const,
        aliases: [c.shortName],
        summary: `${c.race} ${c.className.toLowerCase()} de nivel ${c.level}, ${c.background.toLowerCase()}. ${c.pitch} Lo lleva ${p.name}.`,
        firstSeen: {
          source: `backstory:${c.id}`,
          label: 'La compañía',
          turn: 0,
        },
        events: [],
      },
    ];
  });
  for (const s of seeds) {
    if (s.source === 'world') continue;
    if (s.source !== 'intro' && !chosen.has(s.source)) continue;
    const owner = s.source === 'intro' ? null : presetById(s.source);
    entries.push({
      id: slug(s.name),
      name: s.name,
      kind: s.kind,
      aliases: s.aliases ?? [],
      summary: s.summary,
      firstSeen: {
        source: s.source === 'intro' ? 'intro' : `backstory:${s.source}`,
        label: owner ? `Trasfondo de ${owner.shortName}` : 'Introducción',
        turn: 0,
      },
      events: [],
    });
  }
  return entries;
};

/** "character | Toblen Piedracolina | Posadero del Ciervo Dormido" → note. */
const parseLoreNotes = (raw: string[]): LoreNote[] =>
  raw.flatMap((line) => {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 3) return [];
    const [k = '', name = '', ...rest] = parts;
    const kind = (LORE_KINDS as readonly string[]).includes(k.toLowerCase())
      ? (k.toLowerCase() as LoreKind)
      : null;
    const text = rest.join(' | ').trim();
    if (!kind || !name || !text) return [];
    return [{ kind, name, text }];
  });

const findEntry = (lore: LoreEntry[], name: string) => {
  const n = norm(name);
  return lore.find(
    (e) => norm(e.name) === n || e.aliases.some((a) => norm(a) === n),
  );
};

/** Adds this turn's notes: new names become entries, known ones gain an event. */
const mergeLore = (
  lore: LoreEntry[],
  notes: LoreNote[],
  turn: number,
  turnLabel: string,
): LoreEntry[] => {
  const next = lore.map((e) => ({ ...e, events: [...e.events] }));
  for (const note of notes) {
    const existing = findEntry(next, note.name);
    if (existing) {
      if (!existing.events.some((ev) => ev.text === note.text)) {
        existing.events.push({ turn, text: note.text });
      }
      continue;
    }
    next.push({
      id: `${slug(note.name)}-${turn}`,
      name: note.name,
      kind: note.kind,
      aliases: [],
      summary: note.text,
      firstSeen: { source: `turn:${turn}`, label: turnLabel, turn },
      events: [],
    });
  }
  return next;
};

/**
 * World entries the story has just named for the first time become known,
 * with the turn as their first sighting.
 */
const revealWorldLore = (
  lore: LoreEntry[],
  campaignId: string,
  text: string,
  turn: number,
  turnLabel: string,
): LoreEntry[] => {
  const seeds = (LORE_SEEDS[campaignId] ?? []).filter(
    (s) => s.source === 'world',
  );
  if (seeds.length === 0) return lore;
  const plainText = norm(text);
  const next = [...lore];
  for (const s of seeds) {
    if (findEntry(next, s.name)) continue;
    const names = [s.name, ...(s.aliases ?? [])].map(norm);
    if (!names.some((n) => plainText.includes(n))) continue;
    next.push({
      id: slug(s.name),
      name: s.name,
      kind: s.kind,
      aliases: s.aliases ?? [],
      summary: s.summary,
      firstSeen: { source: `turn:${turn}`, label: turnLabel, turn },
      events: [],
    });
  }
  return next;
};

type Mention = { start: number; end: number; entry: LoreEntry };

/** Where known names appear in a text, longest names first, no overlaps. */
const findMentions = (text: string, lore: LoreEntry[]): Mention[] => {
  const names = lore
    .flatMap((entry) =>
      [entry.name, ...entry.aliases].map((n) => ({ n, entry })),
    )
    .filter((x) => x.n.length >= 3)
    .sort((a, b) => b.n.length - a.n.length);
  const taken: boolean[] = new Array(text.length).fill(false);
  const out: Mention[] = [];
  // Positions must map back to the original: only strip accents when that
  // keeps the length (it does for Spanish).
  const stripped = norm(text);
  const plain = stripped.length === text.length ? stripped : text.toLowerCase();
  for (const { n, entry } of names) {
    const needle = norm(n);
    let from = 0;
    while (from < plain.length) {
      const at = plain.indexOf(needle, from);
      if (at < 0) break;
      const end = at + needle.length;
      const before = at === 0 ? ' ' : (plain[at - 1] ?? ' ');
      const after = end >= plain.length ? ' ' : (plain[end] ?? ' ');
      const boundary = !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
      if (boundary && !taken.slice(at, end).some(Boolean)) {
        for (let i = at; i < end; i += 1) taken[i] = true;
        out.push({ start: at, end, entry });
      }
      from = end;
    }
  }
  return out.sort((a, b) => a.start - b.start);
};

export {
  findEntry,
  findMentions,
  LORE_KIND_LABEL,
  LORE_KINDS,
  mergeLore,
  parseLoreNotes,
  revealWorldLore,
  seedLore,
};
export type { LoreEntry, LoreEvent, LoreKind, LoreNote, Mention };
