import { presetById } from '@/data/characters/presets';
import {
  ABILITIES,
  ABILITY_LABEL,
  modifier,
  proficiencyBonus,
  SKILLS,
} from '@/lib/dnd/rules';
import { BOTH, type RollRequest, type RollResult, type Who } from './schema';

/** Skill or save modifier from the character sheet, by Spanish name. */
const modifierFor = (characterId: string, skill: string): number => {
  const c = presetById(characterId);
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

/**
 * Who actually rolls a shared check: the better of the party, as at most
 * tables ("help" is implied). Unknown ids fall back to the first character.
 */
const rollerFor = (
  who: Who,
  skill: string,
  characterIds: readonly string[],
): string => {
  const first = characterIds[0] ?? who;
  if (who !== BOTH) return characterIds.includes(who) ? who : first;
  let best = first;
  let bestMod = Number.NEGATIVE_INFINITY;
  for (const id of characterIds) {
    const m = modifierFor(id, skill);
    if (m > bestMod) {
      best = id;
      bestMod = m;
    }
  }
  return best;
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
