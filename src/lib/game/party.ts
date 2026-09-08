import type { ArtEntry } from '@/data/art/schema';
import { type CharacterPreset, presetById } from '@/data/characters/presets';
import type { CharacterState, Effects, GameState, Player } from './schema';

/**
 * Client-safe helpers around the two people at the table and the characters
 * they chose. Art is resolved on the server and passed in as a roster.
 */

/** Seat colours: the first player rolls gold, the second rolls ice. */
const SEAT_COLORS = ['#c19429', '#bdd6e6'] as const;

/** What the server knows about each preset that the client cannot load. */
type RosterEntry = {
  id: string;
  portrait: ArtEntry | undefined;
};

type PartyMember = {
  id: string;
  /** Character short name ("Bram"). */
  name: string;
  /** Person playing them ("Loncio"). */
  playerName: string;
  color: string;
  portrait: ArtEntry | undefined;
  character: CharacterPreset;
};

const seatColor = (seat: number) => SEAT_COLORS[seat] ?? '#c3a76e';

/** The party in seat order, with presets and portraits attached. */
const buildParty = (players: Player[], roster: RosterEntry[]): PartyMember[] =>
  players.flatMap((p, seat) => {
    const character = presetById(p.characterId);
    if (!character) return [];
    return [
      {
        id: character.id,
        name: character.shortName,
        playerName: p.name,
        color: seatColor(seat),
        portrait: roster.find((r) => r.id === character.id)?.portrait,
        character,
      },
    ];
  });

const freshCharacterState = (c: CharacterPreset): CharacterState => ({
  id: c.id,
  hp: c.hp.max,
  maxHp: c.hp.max,
  gold: c.coins.gp,
  items: c.inventory.map((i) => i.name),
});

/** A brand-new campaign for these players. */
const newGameState = (input: {
  campaignId: string;
  model: GameState['model'];
  death: GameState['death'];
  players: Player[];
}): GameState => {
  const now = new Date().toISOString();
  return {
    version: 2,
    campaignId: input.campaignId,
    model: input.model,
    death: input.death,
    createdAt: now,
    updatedAt: now,
    players: input.players,
    characters: input.players.flatMap((p) => {
      const c = presetById(p.characterId);
      return c ? [freshCharacterState(c)] : [];
    }),
    memory: [],
    npcArt: {},
    history: [],
  };
};

/** Applies a turn's hp/gold/item changes; hp stays within 0..max. */
const applyEffects = (
  characters: CharacterState[],
  effects: Effects,
): CharacterState[] =>
  characters.map((c) => {
    const hp = effects.hp
      .filter((e) => e.who === c.id)
      .reduce((s, e) => s + e.delta, 0);
    const gold = effects.gold
      .filter((e) => e.who === c.id)
      .reduce((s, e) => s + e.delta, 0);
    const items = [...c.items];
    for (const it of effects.items) {
      if (it.who !== c.id) continue;
      if (it.add) items.push(it.add);
      if (it.remove) {
        const at = items.indexOf(it.remove);
        if (at >= 0) items.splice(at, 1);
      }
    }
    return {
      ...c,
      hp: Math.max(0, Math.min(c.maxHp, c.hp + hp)),
      gold: Math.max(0, c.gold + gold),
      items,
    };
  });

/**
 * A preset with the live state folded in, for the paper sheet and the pack:
 * current hp, gold, and the items the narrator has added or taken.
 */
const liveCharacter = (
  c: CharacterPreset,
  state: CharacterState | undefined,
): CharacterPreset => {
  if (!state) return c;
  const known = new Map(c.inventory.map((i) => [i.name, i]));
  const counts = new Map<string, number>();
  for (const name of state.items) counts.set(name, (counts.get(name) ?? 0) + 1);
  const inventory = [...counts.entries()].map(([name, n]) => {
    const base = known.get(name);
    if (base)
      return base.qty && n === 1 ? base : { ...base, qty: n * (base.qty ?? 1) };
    return { name, icon: name, qty: n > 1 ? n : undefined };
  });
  return {
    ...c,
    hp: { ...c.hp, current: state.hp, max: state.maxHp },
    coins: { ...c.coins, gp: state.gold },
    inventory,
  };
};

export {
  applyEffects,
  buildParty,
  freshCharacterState,
  liveCharacter,
  newGameState,
  SEAT_COLORS,
  seatColor,
};
export type { PartyMember, RosterEntry };
