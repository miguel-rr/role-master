import type { ArtEntry } from '@/data/art/schema';
import type { CharacterPreset } from '@/data/characters/presets';
import {
  ABILITIES,
  ABILITY_LABEL,
  modifier,
  proficiencyBonus,
  SKILLS,
  signed,
} from '@/lib/dnd/rules';

/** Everything the four proposals need, computed once. */
type SheetModel = {
  c: CharacterPreset;
  portrait: ArtEntry | undefined;
  itemArt: Map<string, ArtEntry | undefined>;
  pb: number;
  passive: number;
  initiative: string;
  abilities: {
    id: (typeof ABILITIES)[number];
    name: string;
    short: string;
    score: number;
    mod: string;
    save: string;
    saveProf: boolean;
  }[];
  skills: {
    id: string;
    name: string;
    ability: string;
    mod: string;
    prof: boolean;
    value: number;
  }[];
  hpPct: number;
};

const buildSheetModel = (
  c: CharacterPreset,
  portrait: ArtEntry | undefined,
  itemArt: Map<string, ArtEntry | undefined>,
): SheetModel => {
  const pb = proficiencyBonus(c.level);
  const abilities = ABILITIES.map((id) => {
    const prof = c.saveProficiencies.includes(id);
    return {
      id,
      name: ABILITY_LABEL[id].name,
      short: ABILITY_LABEL[id].short,
      score: c.scores[id],
      mod: signed(modifier(c.scores[id])),
      save: signed(modifier(c.scores[id]) + (prof ? pb : 0)),
      saveProf: prof,
    };
  });
  const skills = SKILLS.map((s) => {
    const prof = c.skillProficiencies.includes(s.id);
    const value = modifier(c.scores[s.ability]) + (prof ? pb : 0);
    return {
      id: s.id,
      name: s.name,
      ability: ABILITY_LABEL[s.ability].short,
      mod: signed(value),
      prof,
      value,
    };
  });
  return {
    c,
    portrait,
    itemArt,
    pb,
    passive:
      10 +
      modifier(c.scores.wis) +
      (c.skillProficiencies.includes('perception') ? pb : 0),
    initiative: signed(modifier(c.scores.dex)),
    abilities,
    skills,
    hpPct: Math.round((c.hp.current / c.hp.max) * 100),
  };
};

export { buildSheetModel };
export type { SheetModel };
