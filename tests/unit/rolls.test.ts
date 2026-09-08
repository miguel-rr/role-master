import { describe, expect, it } from 'vitest';
import { modifierFor, rollerFor, scoreRoll } from '@/lib/game/rolls';
import { BOTH } from '@/lib/game/schema';

describe('modifierFor', () => {
  it('reads skills, saves, initiative and bare abilities from the sheet', () => {
    // Bram: STR 16 (+3), proficient in Athletics (+2) → +5.
    expect(modifierFor('bram', 'Atletismo')).toBe(5);
    // Nissa: DEX 17 (+3), proficient in Stealth → +5 (expertise is narrated).
    expect(modifierFor('nissa', 'Sigilo')).toBe(5);
    expect(modifierFor('nissa', 'Iniciativa')).toBe(3);
    expect(modifierFor('bram', 'Salvación de Constitución')).toBe(4);
    expect(modifierFor('bram', 'Fuerza')).toBe(3);
    expect(modifierFor('bram', 'Percepción')).toBe(3);
  });
  it('is zero for unknown characters or skills', () => {
    expect(modifierFor('nobody', 'Atletismo')).toBe(0);
    expect(modifierFor('bram', 'Cocina')).toBe(0);
  });
});

describe('rollerFor', () => {
  const ids = ['bram', 'nissa'];
  it('keeps a named roller', () => {
    expect(rollerFor('nissa', 'Atletismo', ids)).toBe('nissa');
  });
  it('picks the best of the party for a shared check', () => {
    expect(rollerFor(BOTH, 'Sigilo', ids)).toBe('nissa');
    expect(rollerFor(BOTH, 'Atletismo', ids)).toBe('bram');
    expect(rollerFor(BOTH, 'Medicina', ['dagna', 'thokk'])).toBe('dagna');
  });
  it('falls back to the first seat for an id that is not at the table', () => {
    expect(rollerFor('sariel', 'Arcanos', ids)).toBe('bram');
  });
});

describe('scoreRoll', () => {
  const req = { skill: 'Persuasión', dc: 12, advantage: 'none' as const };
  it('adds the modifier and compares with the DC', () => {
    expect(scoreRoll(req, [10], 2)).toMatchObject({
      result: 10,
      total: 12,
      success: true,
      critical: null,
    });
    expect(scoreRoll(req, [9], 2).success).toBe(false);
  });
  it('treats natural 20 and 1 as automatic', () => {
    expect(scoreRoll({ ...req, dc: 30 }, [20], 0)).toMatchObject({
      success: true,
      critical: 'hit',
    });
    expect(scoreRoll({ ...req, dc: 2 }, [1], 10)).toMatchObject({
      success: false,
      critical: 'miss',
    });
  });
  it('keeps the right die with advantage and disadvantage', () => {
    expect(
      scoreRoll({ ...req, advantage: 'advantage' }, [4, 17], 0).result,
    ).toBe(17);
    expect(
      scoreRoll({ ...req, advantage: 'disadvantage' }, [4, 17], 0).result,
    ).toBe(4);
  });
});
