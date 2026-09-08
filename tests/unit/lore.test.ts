import { describe, expect, it } from 'vitest';
import {
  findMentions,
  mergeLore,
  parseLoreNotes,
  seedLore,
} from '@/lib/game/lore';

const players = [
  { name: 'Loncio', characterId: 'dagna' },
  { name: 'JasspeR', characterId: 'corran' },
];

describe('lore', () => {
  it('seeds the introduction and only the chosen backstories', () => {
    const lore = seedLore('icespire-act1', players);
    const names = lore.map((e) => e.name);
    expect(names).toContain('Phandalin');
    expect(names).toContain('Dazlyn Cascagrís');
    expect(names).toContain('Adabra Gwynn');
    expect(names).not.toContain('Halia Thornton');
    expect(names).toContain('Dagna Yunquebronce');
    expect(lore.find((e) => e.name === 'Adabra Gwynn')?.firstSeen.label).toBe(
      'Trasfondo de Corran',
    );
  });
  it('parses the narrator lines and drops malformed ones', () => {
    expect(
      parseLoreNotes([
        'character | Toblen Piedracolina | Posadero del Ciervo Dormido.',
        'PLACE | Colina Umbrage | Molino en la cima.',
        'dragon | Cryovain | no es un tipo válido',
        'sin separadores',
      ]),
    ).toEqual([
      {
        kind: 'character',
        name: 'Toblen Piedracolina',
        text: 'Posadero del Ciervo Dormido.',
      },
      { kind: 'place', name: 'Colina Umbrage', text: 'Molino en la cima.' },
    ]);
  });
  it('adds events to known names (by alias too) and creates the rest', () => {
    const seeded = seedLore('icespire-act1', players);
    const next = mergeLore(
      seeded,
      parseLoreNotes([
        'character | Adabra | Os venda las heridas.',
        'character | Toblen Piedracolina | Posadero.',
      ]),
      3,
      'Capítulo I · Molino',
    );
    const adabra = next.find((e) => e.name === 'Adabra Gwynn');
    expect(adabra?.events).toEqual([
      { turn: 3, text: 'Os venda las heridas.' },
    ]);
    const toblen = next.find((e) => e.name === 'Toblen Piedracolina');
    expect(toblen?.firstSeen).toEqual({
      source: 'turn:3',
      label: 'Capítulo I · Molino',
      turn: 3,
    });
    expect(next.length).toBe(seeded.length + 1);
    // Idempotent for the same note.
    const again = mergeLore(
      next,
      parseLoreNotes(['character | Adabra | Os venda las heridas.']),
      4,
      'x',
    );
    expect(again.find((e) => e.name === 'Adabra Gwynn')?.events).toHaveLength(
      1,
    );
  });
  it('finds names and aliases in text without overlaps, longest first', () => {
    const lore = seedLore('icespire-act1', players);
    const text =
      'Llegáis a Phandalin y preguntáis por Adabra en el Ciervo Dormido, cerca de la Colina Umbrage.';
    const found = findMentions(text, lore).map((m) =>
      text.slice(m.start, m.end),
    );
    expect(found).toEqual([
      'Phandalin',
      'Adabra',
      'el Ciervo Dormido',
      'Colina Umbrage',
    ]);
    expect(findMentions('phandalinense', lore)).toHaveLength(0);
  });
});

describe('world lore', () => {
  it('stays hidden until the story names it, then joins with that turn', async () => {
    const { revealWorldLore } = await import('@/lib/game/lore');
    const seeded = seedLore('icespire-act1', players);
    expect(seeded.find((e) => e.name === 'Capas Rojas')).toBeUndefined();
    const same = revealWorldLore(
      seeded,
      'icespire-act1',
      'Nada que ver aquí.',
      2,
      'x',
    );
    expect(same).toHaveLength(seeded.length);
    const next = revealWorldLore(
      seeded,
      'icespire-act1',
      'Dicen que los Capas Rojas cobran por respirar.',
      2,
      'Capítulo I · Phandalin',
    );
    const capas = next.find((e) => e.name === 'Capas Rojas');
    expect(capas?.firstSeen).toEqual({
      source: 'turn:2',
      label: 'Capítulo I · Phandalin',
      turn: 2,
    });
  });
});
