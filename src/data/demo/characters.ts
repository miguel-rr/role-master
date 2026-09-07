import type { Ability } from '@/lib/dnd/rules';

/** Demo characters for the design lab: two classic beginner presets. */

type Attack = {
  name: string;
  bonus: number;
  damage: string;
  notes?: string;
};

type InventoryItem = {
  name: string;
  /** Lookup name in the bg3 icon catalogue (English). */
  icon: string;
  qty?: number;
  weight?: number;
  equipped?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary';
};

type DemoCharacter = {
  id: string;
  player: string;
  name: string;
  race: string;
  raceTag: string;
  gender: 'male' | 'female';
  className: string;
  classTag: string;
  level: number;
  background: string;
  alignment: string;
  xp: number;
  scores: Record<Ability, number>;
  saveProficiencies: Ability[];
  skillProficiencies: string[];
  armorClass: number;
  armorNote: string;
  speed: number;
  hp: { max: number; current: number; temp: number };
  hitDie: string;
  attacks: Attack[];
  inventory: InventoryItem[];
  coins: { pp: number; gp: number; ep: number; sp: number; cp: number };
  features: { name: string; text: string }[];
  proficiencies: string[];
  languages: string[];
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  portraitSeed: string;
};

const bram: DemoCharacter = {
  id: 'bram',
  player: 'Miguel',
  name: 'Bram Piedrahonda',
  race: 'Humano',
  raceTag: 'human',
  gender: 'male',
  className: 'Guerrero',
  classTag: 'fighter',
  level: 1,
  background: 'Soldado',
  alignment: 'Legal bueno',
  xp: 0,
  scores: { str: 16, dex: 12, con: 15, int: 10, wis: 13, cha: 8 },
  saveProficiencies: ['str', 'con'],
  skillProficiencies: ['athletics', 'intimidation', 'perception', 'survival'],
  armorClass: 18,
  armorNote: 'Cota de malla y escudo',
  speed: 30,
  hp: { max: 12, current: 9, temp: 0 },
  hitDie: '1d10',
  attacks: [
    {
      name: 'Espada larga',
      bonus: 5,
      damage: '1d8+3 cortante',
      notes: 'Versátil (1d10)',
    },
    {
      name: 'Jabalina',
      bonus: 5,
      damage: '1d6+3 perforante',
      notes: 'Alcance 30/120',
    },
    {
      name: 'Ballesta ligera',
      bonus: 3,
      damage: '1d8+1 perforante',
      notes: 'Alcance 80/320',
    },
  ],
  inventory: [
    { name: 'Espada larga', icon: 'Longsword', equipped: true, weight: 3 },
    { name: 'Escudo', icon: 'Shield', equipped: true, weight: 6 },
    { name: 'Cota de malla', icon: 'Chain Mail', equipped: true, weight: 55 },
    { name: 'Jabalina', icon: 'Javelin', qty: 4, weight: 2 },
    { name: 'Ballesta ligera', icon: 'Light Crossbow', weight: 5 },
    { name: 'Virotes', icon: 'Arrow of Darkness', qty: 20 },
    {
      name: 'Poción de curación',
      icon: 'Potion of Healing',
      qty: 1,
      rarity: 'common',
    },
    { name: 'Raciones', icon: 'Camp Supply Sack', qty: 10 },
    { name: 'Soga de cáñamo (50 pies)', icon: 'Rope' },
    { name: 'Antorcha', icon: 'Torch', qty: 10 },
    { name: 'Insignia de rango', icon: 'Amulet Necklace B Gold A' },
    { name: 'Saco de dormir', icon: 'Heavy Supply Pack' },
  ],
  coins: { pp: 0, gp: 10, ep: 0, sp: 7, cp: 12 },
  features: [
    {
      name: 'Estilo de combate: Defensa',
      text: '+1 a la CA mientras lleves armadura.',
    },
    {
      name: 'Tomar aliento',
      text: 'Acción adicional: recuperas 1d10 + 1 PV. Una vez por descanso.',
    },
    {
      name: 'Rango militar',
      text: 'Los soldados leales a tu antigua organización reconocen tu autoridad.',
    },
  ],
  proficiencies: [
    'Todas las armaduras',
    'Escudos',
    'Armas sencillas y marciales',
    'Vehículos terrestres',
    'Juegos de cartas',
  ],
  languages: ['Común', 'Enano'],
  traits:
    'Siempre soy educado y respetuoso. Me río a carcajadas cuando algo me hace gracia, aunque no venga a cuento.',
  ideals: 'Responsabilidad. Hago lo que debo y obedezco a la autoridad justa.',
  bonds:
    'Alguien salvó mi vida en el campo de batalla. Nunca dejaré atrás a un amigo.',
  flaws: 'Mi odio hacia mis enemigos es ciego e irracional.',
  portraitSeed: 'bram-1',
};

const nissa: DemoCharacter = {
  id: 'nissa',
  player: 'Invitado',
  name: 'Nissa Brisaverde',
  race: 'Mediana',
  raceTag: 'halfling',
  gender: 'female',
  className: 'Pícara',
  classTag: 'rogue',
  level: 1,
  background: 'Criminal',
  alignment: 'Caótica buena',
  xp: 0,
  scores: { str: 8, dex: 17, con: 13, int: 12, wis: 10, cha: 14 },
  saveProficiencies: ['dex', 'int'],
  skillProficiencies: [
    'acrobatics',
    'deception',
    'sleight-of-hand',
    'stealth',
    'perception',
    'persuasion',
  ],
  armorClass: 14,
  armorNote: 'Armadura de cuero',
  speed: 25,
  hp: { max: 9, current: 9, temp: 0 },
  hitDie: '1d8',
  attacks: [
    { name: 'Estoque', bonus: 5, damage: '1d8+3 perforante', notes: 'Sutil' },
    {
      name: 'Arco corto',
      bonus: 5,
      damage: '1d6+3 perforante',
      notes: 'Alcance 80/320',
    },
    {
      name: 'Daga',
      bonus: 5,
      damage: '1d4+3 perforante',
      notes: 'Arrojadiza 20/60',
    },
  ],
  inventory: [
    { name: 'Estoque', icon: 'Rapier', equipped: true, weight: 2 },
    { name: 'Arco corto', icon: 'Shortbow', weight: 2 },
    { name: 'Flechas', icon: 'Arrow of Ilmater', qty: 20 },
    { name: 'Daga', icon: 'Dagger', qty: 2, weight: 1 },
    {
      name: 'Armadura de cuero',
      icon: 'Leather Armour',
      equipped: true,
      weight: 10,
    },
    { name: 'Herramientas de ladrón', icon: 'Thieves Tools' },
    { name: 'Palanca', icon: 'Crowbar' },
    { name: 'Ropas oscuras con capucha', icon: 'Cloak' },
    {
      name: 'Poción de curación',
      icon: 'Potion of Healing',
      qty: 2,
      rarity: 'common',
    },
    { name: 'Raciones', icon: 'Camp Supply Sack', qty: 5 },
    {
      name: 'Anillo de plata sin grabar',
      icon: 'Gemless Ring',
      rarity: 'uncommon',
    },
    { name: 'Odre', icon: 'Iron Flask' },
  ],
  coins: { pp: 0, gp: 15, ep: 0, sp: 3, cp: 0 },
  features: [
    {
      name: 'Ataque furtivo',
      text: '1d6 de daño extra una vez por turno si tienes ventaja o un aliado adyacente al objetivo.',
    },
    {
      name: 'Pericia',
      text: 'Doble bonificador de competencia en Sigilo y Herramientas de ladrón.',
    },
    {
      name: 'Jerga de ladrones',
      text: 'Conoces el argot secreto de los bajos fondos.',
    },
    {
      name: 'Afortunada',
      text: 'Cuando sacas un 1 en un d20, puedes repetir la tirada.',
    },
  ],
  proficiencies: [
    'Armadura ligera',
    'Armas sencillas',
    'Ballesta de mano',
    'Espada larga',
    'Estoque',
    'Espada corta',
    'Herramientas de ladrón',
    'Juegos de dados',
  ],
  languages: ['Común', 'Mediano', 'Jerga de ladrones'],
  traits:
    'Siempre tengo un plan para cuando las cosas salen mal. No me importa robar a quien puede permitírselo.',
  ideals:
    'Libertad. Las cadenas están hechas para romperse, igual que quienes las forjan.',
  bonds:
    'Le debo la vida a una vieja contrabandista de Neverwinter. Algún día se la pagaré.',
  flaws:
    'Si veo algo valioso, no puedo pensar en otra cosa que en cómo robarlo.',
  portraitSeed: 'nissa-1',
};

const DEMO_CHARACTERS = [bram, nissa];

export { DEMO_CHARACTERS };
export type { Attack, DemoCharacter, InventoryItem };
