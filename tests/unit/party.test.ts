import { describe, expect, it } from 'vitest';
import { CHARACTER_PRESETS, presetById } from '@/data/characters/presets';
import {
  applyEffects,
  buildParty,
  liveCharacter,
  newGameState,
} from '@/lib/game/party';

describe('presets', () => {
  it('has six distinct beginners with a story and a hook each', () => {
    expect(CHARACTER_PRESETS).toHaveLength(6);
    expect(new Set(CHARACTER_PRESETS.map((c) => c.id)).size).toBe(6);
    expect(new Set(CHARACTER_PRESETS.map((c) => c.portraitId)).size).toBe(6);
    for (const c of CHARACTER_PRESETS) {
      expect(c.level).toBe(1);
      expect(c.backstory.length).toBeGreaterThan(200);
      expect(c.hook.length).toBeGreaterThan(80);
      expect(c.inventory.length).toBeGreaterThan(5);
      expect(c.strengths.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('applyEffects', () => {
  const base = newGameState({
    campaignId: 'icespire-act1',
    model: 'claude-opus-5',
    death: 'never',
    players: [
      { name: 'Lon', characterId: 'bram' },
      { name: 'Jato', characterId: 'nissa' },
    ],
  }).characters;
  it('clamps hp, floors gold and adds/removes one item at a time', () => {
    const next = applyEffects(base, {
      hp: [
        { who: 'bram', delta: -50 },
        { who: 'nissa', delta: +10 },
      ],
      gold: [{ who: 'nissa', delta: -100 }],
      items: [
        { who: 'bram', add: 'Llave de bronce' },
        { who: 'bram', remove: 'Antorcha' },
        { who: 'nissa', remove: 'No existe' },
      ],
    });
    const bram = next.find((c) => c.id === 'bram');
    const nissa = next.find((c) => c.id === 'nissa');
    expect(bram?.hp).toBe(0);
    expect(nissa?.hp).toBe(9);
    expect(nissa?.gold).toBe(0);
    expect(bram?.items).toContain('Llave de bronce');
    expect(bram?.items).not.toContain('Antorcha');
    expect(nissa?.items).toHaveLength(base[1]?.items.length ?? 0);
  });
});

describe('liveCharacter', () => {
  it('folds hp, gold and narrator items into the sheet', () => {
    const c = presetById('nissa');
    if (!c) throw new Error('nissa missing');
    const live = liveCharacter(c, {
      id: 'nissa',
      hp: 4,
      maxHp: 9,
      gold: 40,
      items: [
        'Estoque',
        'Poción de curación',
        'Poción de curación',
        'Llave de bronce',
      ],
    });
    expect(live.hp.current).toBe(4);
    expect(live.coins.gp).toBe(40);
    expect(live.inventory.map((i) => i.name)).toEqual([
      'Estoque',
      'Poción de curación',
      'Llave de bronce',
    ]);
    expect(live.inventory[1]?.qty).toBe(4);
    expect(live.inventory[2]?.icon).toBe('Llave de bronce');
  });
});

describe('buildParty', () => {
  it('seats players in order with their colours and presets', () => {
    const party = buildParty(
      [
        { name: 'Lon', characterId: 'corran' },
        { name: 'Jato', characterId: 'dagna' },
      ],
      [{ id: 'dagna', portrait: undefined }],
    );
    expect(party.map((p) => p.name)).toEqual(['Corran', 'Dagna']);
    expect(party.map((p) => p.playerName)).toEqual(['Lon', 'Jato']);
    expect(party[0]?.color).not.toBe(party[1]?.color);
  });
});
