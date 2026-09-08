import { DEMO_CHARACTERS } from '@/data/demo/characters';
import {
  ABILITIES,
  ABILITY_LABEL,
  modifier,
  proficiencyBonus,
  SKILLS,
} from '@/lib/dnd/rules';
import type { RollRequest, RollResult, Who } from './schema';

/**
 * Who actually rolls a shared check: the better of the two, as at most
 * tables ("help" is implied).
 */
const rollerFor = (who: Who, skill: string): 'bram' | 'nissa' => {
  if (who !== 'both') return who;
  const a = modifierFor('bram', skill);
  const b = modifierFor('nissa', skill);
  return b > a ? 'nissa' : 'bram';
};

/** Skill or save modifier from the character sheet, by Spanish name. */
const modifierFor = (id: 'bram' | 'nissa', skill: string): number => {
  const c = DEMO_CHARACTERS.find((x) => x.id === id);
  if (!c) return 0;
  const pb = proficiencyBonus(c.level);
  const name = skill.trim().toLowerCase();
  if (name === 'iniciativa') return modifier(c.scores.dex);
  const save = /^salvaci[oó]n de (.+)$/.exec(name);
  if (save) {
    const ab = ABILITIES.find(
      (a) => ABILITY_LABEL[a].name.toLowerCase() === save[1]?.trim(),
    );
    if (!ab) return 0;
    return modifier(c.scores[ab]) + (c.saveProficiencies.includes(ab) ? pb : 0);
  }
  const s = SKILLS.find((x) => x.name.toLowerCase() === name);
  if (s) {
    const prof = c.skillProficiencies.includes(s.id) ? pb : 0;
    return modifier(c.scores[s.ability]) + prof;
  }
  // A bare ability check ("Fuerza").
  const ab = ABILITIES.find(
    (a) => ABILITY_LABEL[a].name.toLowerCase() === name,
  );
  return ab ? modifier(c.scores[ab]) : 0;
};

/** Scores a d20 (or two, with advantage/disadvantage) against a DC. */
const scoreRoll = (
  request: RollRequest,
  dice: number[],
  mod: number,
): RollResult => {
  const [a = 1, b] = dice;
  const kept =
    request.advantage === 'advantage' && b !== undefined
      ? Math.max(a, b)
      : request.advantage === 'disadvantage' && b !== undefined
        ? Math.min(a, b)
        : a;
  const total = kept + mod;
  const critical: RollResult['critical'] =
    kept === 20 ? 'hit' : kept === 1 ? 'miss' : null;
  const success = kept === 20 || (kept !== 1 && total >= request.dc);
  return {
    ...request,
    modifier: mod,
    result: kept,
    total,
    success,
    critical,
  };
};

export { modifierFor, rollerFor, scoreRoll };
