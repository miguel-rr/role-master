import type { ArtEntry } from '@/data/art/schema';
import type { CharacterPreset } from '@/data/characters/presets';
import {
  ABILITIES,
  ABILITY_LABEL,
  type Ability,
  modifier,
  proficiencyBonus,
  SKILLS,
  signed,
} from '@/lib/dnd/rules';

/**
 * Everything the sheet shows, computed once, each number with the formula
 * that produced it so the player can hover and see where it comes from.
 */

type Calc = { value: string; formula: string };

type SheetModel = {
  c: CharacterPreset;
  portrait: ArtEntry | undefined;
  itemArt: Map<string, ArtEntry | undefined>;
  pb: Calc;
  passive: Calc;
  initiative: Calc;
  armor: Calc;
  hpMax: Calc;
  abilities: {
    id: Ability;
    name: string;
    short: string;
    score: number;
    mod: Calc;
    save: Calc;
    saveProf: boolean;
  }[];
  skills: {
    id: string;
    name: string;
    ability: string;
    mod: Calc;
    prof: boolean;
  }[];
  attacks: { name: string; bonus: Calc; damage: string; notes?: string }[];
  hpPct: number;
};

const ARMOR: [
  RegExp,
  { base: number; dex: 'full' | 'max2' | 'none'; label: string },
][] = [
  [/cota de malla/i, { base: 16, dex: 'none', label: 'Cota de malla 16' }],
  [/cota de escamas/i, { base: 14, dex: 'max2', label: 'Cota de escamas 14' }],
  [/cuero tachonado/i, { base: 12, dex: 'full', label: 'Cuero tachonado 12' }],
  [/cuero/i, { base: 11, dex: 'full', label: 'Armadura de cuero 11' }],
  [/coraza/i, { base: 14, dex: 'max2', label: 'Coraza 14' }],
  [/media armadura/i, { base: 15, dex: 'max2', label: 'Media armadura 15' }],
  [/sin armadura/i, { base: 10, dex: 'full', label: 'Sin armadura 10' }],
];

const armorCalc = (c: CharacterPreset): Calc => {
  const dex = modifier(c.scores.dex);
  const con = modifier(c.scores.con);
  const hit = ARMOR.find(([re]) => re.test(c.armorNote));
  if (!hit) return { value: String(c.armorClass), formula: c.armorNote };
  const a = hit[1];
  const parts = [a.label];
  let total = a.base;
  if (a.dex === 'full') {
    total += dex;
    parts.push(`Des ${signed(dex)}`);
  } else if (a.dex === 'max2') {
    const d = Math.min(2, dex);
    total += d;
    parts.push(`Des ${signed(d)} (máx. +2)`);
  }
  if (/defensa sin armadura/i.test(c.armorNote)) {
    total += con;
    parts.push(`Con ${signed(con)} (Defensa sin armadura)`);
  }
  if (/escudo/i.test(c.armorNote)) {
    total += 2;
    parts.push('escudo +2');
  }
  if (/estilo defensa/i.test(c.armorNote)) {
    total += 1;
    parts.push('estilo Defensa +1');
  }
  const formula = `${parts.join(' + ')} = ${total}`;
  return {
    value: String(c.armorClass),
    formula:
      total === c.armorClass
        ? formula
        : `${formula} (la ficha dice ${c.armorClass})`,
  };
};

const attackCalc = (
  c: CharacterPreset,
  a: CharacterPreset['attacks'][number],
  pb: number,
): Calc => {
  const str = modifier(c.scores.str);
  const dex = modifier(c.scores.dex);
  const spell = /rayo|llama|conjuro|hechizo|descarga|proyectil/i.test(a.name);
  const ranged = /arco|ballesta|honda|dardo/i.test(a.name);
  const finesse =
    /sutil|ligera/i.test(a.notes ?? '') ||
    /estoque|daga|espada corta|cimitarra/i.test(a.name);
  if (spell) {
    const ability =
      c.classTag === 'wizard'
        ? 'int'
        : c.classTag === 'cleric' || c.classTag === 'druid'
          ? 'wis'
          : 'cha';
    const m = modifier(c.scores[ability]);
    if (a.bonus === 0)
      return {
        value: signed(a.bonus),
        formula: 'Salvación del objetivo, sin tirada de ataque',
      };
    return {
      value: signed(a.bonus),
      formula: `${ABILITY_LABEL[ability].short} ${signed(m)} + competencia +${pb} = ${signed(m + pb)}`,
    };
  }
  const useDex = ranged || (finesse && dex > str);
  const m = useDex ? dex : str;
  const total = m + pb;
  const base = `${useDex ? 'Des' : 'Fue'} ${signed(m)} + competencia +${pb} = ${signed(total)}`;
  return {
    value: signed(a.bonus),
    formula:
      total === a.bonus ? base : `${base} (la ficha dice ${signed(a.bonus)})`,
  };
};

const buildSheetModel = (
  c: CharacterPreset,
  portrait: ArtEntry | undefined,
  itemArt: Map<string, ArtEntry | undefined>,
): SheetModel => {
  const pb = proficiencyBonus(c.level);
  const abilities = ABILITIES.map((id) => {
    const prof = c.saveProficiencies.includes(id);
    const m = modifier(c.scores[id]);
    const short = ABILITY_LABEL[id].short;
    return {
      id,
      name: ABILITY_LABEL[id].name,
      short,
      score: c.scores[id],
      mod: {
        value: signed(m),
        formula: `(${c.scores[id]} − 10) ÷ 2, redondeado hacia abajo = ${signed(m)}`,
      },
      save: {
        value: signed(m + (prof ? pb : 0)),
        formula: prof
          ? `${short} ${signed(m)} + competencia +${pb} = ${signed(m + pb)}`
          : `${short} ${signed(m)}, sin competencia`,
      },
      saveProf: prof,
    };
  });
  const skills = SKILLS.map((s) => {
    const prof = c.skillProficiencies.includes(s.id);
    const m = modifier(c.scores[s.ability]);
    const short = ABILITY_LABEL[s.ability].short;
    return {
      id: s.id,
      name: s.name,
      ability: short,
      mod: {
        value: signed(m + (prof ? pb : 0)),
        formula: prof
          ? `${short} ${signed(m)} + competencia +${pb} = ${signed(m + pb)}`
          : `${short} ${signed(m)}, sin competencia`,
      },
      prof,
    };
  });
  const perc = skills.find((s) => s.id === 'perception');
  const percVal = perc ? Number(perc.mod.value) : modifier(c.scores.wis);
  const dex = modifier(c.scores.dex);
  const con = modifier(c.scores.con);
  const die = Number(c.hitDie.replace(/^\d*d/, ''));
  return {
    c,
    portrait,
    itemArt,
    pb: {
      value: `+${pb}`,
      formula: `Nivel ${c.level}: bonificador de competencia +${pb}`,
    },
    passive: {
      value: String(10 + percVal),
      formula: `10 + Percepción ${signed(percVal)} = ${10 + percVal}`,
    },
    initiative: {
      value: signed(dex),
      formula: `Modificador de Destreza ${signed(dex)}`,
    },
    armor: armorCalc(c),
    hpMax: {
      value: String(c.hp.max),
      formula: `Dado de golpe ${c.hitDie} al máximo (${die}) + Con ${signed(con)} = ${die + con}${die + con === c.hp.max ? '' : ` (la ficha dice ${c.hp.max})`}`,
    },
    abilities,
    skills,
    attacks: c.attacks.map((a) => ({
      name: a.name,
      bonus: attackCalc(c, a, pb),
      damage: a.damage,
      notes: a.notes,
    })),
    hpPct: Math.round((c.hp.current / c.hp.max) * 100),
  };
};

export { buildSheetModel };
export type { Calc, SheetModel };
