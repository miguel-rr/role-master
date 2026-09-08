import { describe, expect, it } from 'vitest';
import { CHARACTER_PRESETS } from '@/data/characters/presets';
import { loreFor } from '@/data/items/lore';

describe('item lore', () => {
  it('describes every object the presets carry', () => {
    const missing = CHARACTER_PRESETS.flatMap((c) =>
      c.inventory
        .filter((it) => !loreFor(it.name))
        .map((it) => `${c.id}: ${it.name}`),
    );
    expect(missing).toEqual([]);
  });
  it('knows what the scripted narrator hands out', () => {
    expect(loreFor('Poción de curación de Adabra')?.kind).toBe('Poción');
    expect(loreFor('Huella de yeso de la bestia')).toBeDefined();
    expect(loreFor('Cosa inventada')).toBeUndefined();
  });
});
