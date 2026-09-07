/** Core 5e vocabulary used by the sheet and the board. Labels in Spanish. */

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
type Ability = (typeof ABILITIES)[number];

const ABILITY_LABEL: Record<Ability, { name: string; short: string }> = {
  str: { name: 'Fuerza', short: 'FUE' },
  dex: { name: 'Destreza', short: 'DES' },
  con: { name: 'Constitución', short: 'CON' },
  int: { name: 'Inteligencia', short: 'INT' },
  wis: { name: 'Sabiduría', short: 'SAB' },
  cha: { name: 'Carisma', short: 'CAR' },
};

type Skill = {
  id: string;
  name: string;
  ability: Ability;
};

const SKILLS: Skill[] = [
  { id: 'acrobatics', name: 'Acrobacias', ability: 'dex' },
  { id: 'animal-handling', name: 'Trato con animales', ability: 'wis' },
  { id: 'arcana', name: 'Arcanos', ability: 'int' },
  { id: 'athletics', name: 'Atletismo', ability: 'str' },
  { id: 'deception', name: 'Engaño', ability: 'cha' },
  { id: 'history', name: 'Historia', ability: 'int' },
  { id: 'insight', name: 'Perspicacia', ability: 'wis' },
  { id: 'intimidation', name: 'Intimidación', ability: 'cha' },
  { id: 'investigation', name: 'Investigación', ability: 'int' },
  { id: 'medicine', name: 'Medicina', ability: 'wis' },
  { id: 'nature', name: 'Naturaleza', ability: 'int' },
  { id: 'perception', name: 'Percepción', ability: 'wis' },
  { id: 'performance', name: 'Interpretación', ability: 'cha' },
  { id: 'persuasion', name: 'Persuasión', ability: 'cha' },
  { id: 'religion', name: 'Religión', ability: 'int' },
  { id: 'sleight-of-hand', name: 'Juego de manos', ability: 'dex' },
  { id: 'stealth', name: 'Sigilo', ability: 'dex' },
  { id: 'survival', name: 'Supervivencia', ability: 'wis' },
];

const modifier = (score: number) => Math.floor((score - 10) / 2);

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

const proficiencyBonus = (level: number) => 2 + Math.floor((level - 1) / 4);

export { ABILITIES, ABILITY_LABEL, modifier, proficiencyBonus, signed, SKILLS };
export type { Ability, Skill };
