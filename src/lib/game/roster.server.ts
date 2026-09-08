import 'server-only';

import { byId, findItem } from '@/data/art/catalog';
import type { ArtEntry } from '@/data/art/schema';
import { CHARACTER_PRESETS } from '@/data/characters/presets';
import type { RosterEntry } from './party';

/** Portraits for every preset, resolved once per request on the server. */
const rosterArt = (): RosterEntry[] =>
  CHARACTER_PRESETS.map((c) => ({ id: c.id, portrait: byId(c.portraitId) }));

/**
 * Icon art for every item a preset can carry, keyed by the item's icon name
 * and by its Spanish name (the game state stores names).
 */
const itemArtMap = (): Record<string, ArtEntry> => {
  const map: Record<string, ArtEntry> = {};
  for (const c of CHARACTER_PRESETS) {
    for (const it of c.inventory) {
      const art = map[it.icon] ?? findItem(it.icon);
      if (!art) continue;
      map[it.icon] = art;
      map[it.name] = art;
    }
  }
  // Things the scripted or real narrator hands out often.
  for (const [name, icon] of [
    ['Poción de curación de Adabra', 'POT Potion of Healing'],
    ['Huella de yeso de la bestia', 'Heavy Stone'],
  ] as const) {
    const art = findItem(icon);
    if (art) map[name] = art;
  }
  return map;
};

const coinArt = () => ({
  gp: findItem('Coin of Mammon'),
  sp: findItem('Copper Coin Pile'),
  cp: findItem('Copper Coin Pile'),
});

export { coinArt, itemArtMap, rosterArt };
