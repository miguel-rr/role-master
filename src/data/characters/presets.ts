import type { Ability } from '@/lib/dnd/rules';

/**
 * Pre-made level-1 characters for two novice players. Each one carries a
 * backstory and a hook into the first campaign so the narrator can pull on
 * it. Portraits are fixed Owlcat ids so a character always has one face.
 */

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

type CharacterPreset = {
  id: string;
  name: string;
  /** Short name used in the interface and by the narrator. */
  shortName: string;
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
  spells?: { cantrips: string[]; prepared: string[]; slots: number };
  proficiencies: string[];
  languages: string[];
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  /** Catalogue id of the portrait. */
  portraitId: string;
  /** One line to sell the character on the selection screen. */
  pitch: string;
  /** Who they were before Phandalin. */
  backstory: string;
  /** Why Phandalin, and what the campaign has waiting for them. */
  hook: string;
  /** Two words for the pick screen: what they are good at. */
  strengths: string[];
};

const bram: CharacterPreset = {
  id: 'bram',
  name: 'Bram Piedrahonda',
  shortName: 'Bram',
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
  hp: { max: 12, current: 12, temp: 0 },
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
    {
      name: 'Escudo',
      icon: 'Item WPN HUM Shield C 1',
      equipped: true,
      weight: 6,
    },
    { name: 'Cota de malla', icon: 'Chain Mail', equipped: true, weight: 55 },
    { name: 'Jabalina', icon: 'Javelin', qty: 4, weight: 2 },
    { name: 'Ballesta ligera', icon: 'Light Crossbow', weight: 5 },
    { name: 'Virotes', icon: 'Arrow of Darkness', qty: 20 },
    {
      name: 'Poción de curación',
      icon: 'POT Potion of Healing',
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
  portraitId: 'portraits/pc/playerfighter01',
  pitch: 'El muro. Pega fuerte, aguanta más y no sabe mentir.',
  strengths: ['Combate cuerpo a cuerpo', 'Aguante', 'Intimidar'],
  backstory:
    'Doce años en la guardia de Neverwinter, los últimos tres como sargento de la puerta sur. Bram aprendió allí que las ciudades no se defienden con murallas sino con gente que se queda cuando todos corren. Se quedó dos veces. La segunda le costó a su compañía a un hombre, y a él el sueño durante un año.\n\nDejó la guardia sin escándalo, con una insignia que ya no significa nada y una espada que sí. Bebe poco, habla menos y cuenta las salidas de cualquier habitación en la que entra. Le cuesta pedir ayuda y le cuesta aún más aceptar que se la den.',
  hook: 'Lleva en la bolsa una carta sellada del Lord Protector de Neverwinter para el Alcaide de Phandalin, Harbin Wester: la ciudad quiere saber si lo del dragón es real antes de enviar tropas. Bram sospecha que ya saben que es real y que la carta es una forma barata de que alguien vaya a mirar. Ese alguien es él.',
};

const nissa: CharacterPreset = {
  id: 'nissa',
  name: 'Nissa Brisaverde',
  shortName: 'Nissa',
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
      icon: 'POT Potion of Healing',
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
  portraitId: 'portraits/pc/halflingfemalerogue',
  pitch:
    'La sombra. Manos rápidas, lengua más rápida y ningún respeto por las cerraduras.',
  strengths: ['Sigilo', 'Engaño', 'Cerraduras'],
  backstory:
    'Creció en los muelles de Neverwinter robando a quien podía permitírselo y, cuando no había de esos, a quien no. Una contrabandista llamada Mamá Orla la sacó de una celda a los catorce a cambio de tres años de trabajo. Fueron cinco. Nissa aprendió a abrir cualquier cosa que tuviera bisagras y a leer a la gente como si fueran cartas marcadas.\n\nSe fue de Neverwinter una noche de niebla, con una bolsa que no era suya y una deuda que sí. Sonríe mucho, promete poco y nunca da la espalda a una puerta. Bajo el descaro hay alguien que jamás ha tenido nada propio y empieza a preguntarse qué se sentirá.',
  hook: 'Mamá Orla le dio una última tarea antes de dejarla marchar: entregar un paquete lacrado a una tal Halia Thornton, del Intercambio de Mineros de Phandalin, y no abrirlo. Nissa lo ha abierto. Dentro hay una llave de bronce con la marca de los Capas Rojas y una nota: «Ella sabrá qué hacer. Tú, no preguntes».',
};

const dagna: CharacterPreset = {
  id: 'dagna',
  name: 'Dagna Yunquebronce',
  shortName: 'Dagna',
  race: 'Enana',
  raceTag: 'dwarf',
  gender: 'female',
  className: 'Clériga',
  classTag: 'cleric',
  level: 1,
  background: 'Acólita',
  alignment: 'Legal buena',
  xp: 0,
  scores: { str: 14, dex: 8, con: 16, int: 10, wis: 16, cha: 12 },
  saveProficiencies: ['wis', 'cha'],
  skillProficiencies: ['insight', 'medicine', 'religion', 'history'],
  armorClass: 18,
  armorNote: 'Cota de escamas y escudo',
  speed: 25,
  hp: { max: 11, current: 11, temp: 0 },
  hitDie: '1d8',
  attacks: [
    {
      name: 'Martillo de guerra',
      bonus: 4,
      damage: '1d8+2 contundente',
      notes: 'Versátil (1d10)',
    },
    {
      name: 'Llama sagrada',
      bonus: 0,
      damage: '1d8 radiante',
      notes: 'Salvación de Destreza CD 13',
    },
  ],
  inventory: [
    {
      name: 'Martillo de guerra',
      icon: 'Warhammer',
      equipped: true,
      weight: 2,
    },
    {
      name: 'Escudo con el yunque de Moradin',
      icon: 'Item WPN HUM Shield C 1',
      equipped: true,
      weight: 6,
    },
    { name: 'Cota de escamas', icon: 'Scale Mail', equipped: true, weight: 45 },
    { name: 'Símbolo sagrado', icon: 'Amulet Necklace A Silver A' },
    { name: 'Libro de oraciones', icon: 'Book' },
    {
      name: 'Poción de curación',
      icon: 'POT Potion of Healing',
      qty: 1,
      rarity: 'common',
    },
    { name: 'Raciones', icon: 'Camp Supply Sack', qty: 10 },
    { name: 'Incienso', icon: 'VAL MISC Bundle of Incense', qty: 5 },
    { name: 'Vestiduras', icon: 'Clothes' },
    { name: 'Saco de dormir', icon: 'Heavy Supply Pack' },
  ],
  coins: { pp: 0, gp: 15, ep: 0, sp: 0, cp: 0 },
  features: [
    {
      name: 'Dominio de la Vida',
      text: 'Tus conjuros de curación curan 2 + nivel del conjuro PV adicionales.',
    },
    {
      name: 'Lanzamiento de conjuros',
      text: 'Sabiduría. CD 13, ataque +5. Dos espacios de nivel 1.',
    },
    { name: 'Visión en la oscuridad', text: '18 metros.' },
    {
      name: 'Resistencia enana',
      text: 'Ventaja en salvaciones contra veneno; resistencia al daño de veneno.',
    },
    {
      name: 'Refugio de los fieles',
      text: 'Los templos de Moradin te dan cobijo y ayuda.',
    },
  ],
  spells: {
    cantrips: ['Llama sagrada', 'Guía', 'Taumaturgia'],
    prepared: [
      'Curar heridas',
      'Bendición',
      'Escudo de la fe',
      'Palabra de curación',
    ],
    slots: 2,
  },
  proficiencies: [
    'Armadura ligera y media',
    'Armadura pesada',
    'Escudos',
    'Armas sencillas',
    'Hacha de guerra',
    'Martillo de guerra',
    'Herramientas de herrero',
  ],
  languages: ['Común', 'Enano', 'Celestial'],
  traits:
    'Cito escrituras y proverbios en todas las ocasiones. Nada puede sacudir mi actitud optimista.',
  ideals: 'Caridad. Ayudo a los necesitados sin importar el coste.',
  bonds: 'Todo lo que hago es por la gente corriente de la Costa de la Espada.',
  flaws: 'Confío demasiado en quienes comparten mi fe.',
  portraitId: 'portraits/pc/dwarffemalenoble',
  pitch:
    'La roca. Cura, protege y da un martillazo si hace falta convencer a alguien.',
  strengths: ['Curación', 'Armadura pesada', 'Perspicacia'],
  backstory:
    'Nació en Mithral Hall y salió de allí a los cuarenta, que para una enana es tener prisa. Sirvió quince años en el hospital del templo de Moradin en Neverwinter, donde aprendió que la fe se demuestra con las manos: vendando, entablillando, quedándose de noche. Habla despacio, ríe alto y no soporta a los que confunden piedad con debilidad.\n\nTiene una regla que no negocia: nadie se queda atrás, ni siquiera quien no lo merece. Le cuesta más rezar por sí misma que por los demás, y lo sabe.',
  hook: 'Dazlyn Cascagrís, la enana que busca a su hermano por Phandalin, es su prima. Hace un mes dejó de contestar a las cartas. Dagna no ha venido a buscar trabajo: ha venido a buscar a Dazlyn, y no se irá sin ella. Lo del dragón le parece, por ahora, un problema de otros.',
};

const sariel: CharacterPreset = {
  id: 'sariel',
  name: 'Sariel Galanodel',
  shortName: 'Sariel',
  race: 'Elfa',
  raceTag: 'elf',
  gender: 'female',
  className: 'Maga',
  classTag: 'wizard',
  level: 1,
  background: 'Sabia',
  alignment: 'Neutral buena',
  xp: 0,
  scores: { str: 8, dex: 16, con: 12, int: 17, wis: 13, cha: 10 },
  saveProficiencies: ['int', 'wis'],
  skillProficiencies: ['arcana', 'history', 'investigation', 'perception'],
  armorClass: 13,
  armorNote: 'Sin armadura (Destreza)',
  speed: 30,
  hp: { max: 7, current: 7, temp: 0 },
  hitDie: '1d6',
  attacks: [
    {
      name: 'Rayo de escarcha',
      bonus: 5,
      damage: '1d8 frío',
      notes: 'Alcance 60; reduce velocidad 10 pies',
    },
    {
      name: 'Daga',
      bonus: 5,
      damage: '1d4+3 perforante',
      notes: 'Arrojadiza 20/60',
    },
    {
      name: 'Bastón',
      bonus: 1,
      damage: '1d6-1 contundente',
      notes: 'Versátil (1d8)',
    },
  ],
  inventory: [
    { name: 'Libro de conjuros', icon: 'Book', equipped: true, weight: 3 },
    { name: 'Bastón', icon: 'Quarterstaff', weight: 4 },
    { name: 'Daga', icon: 'Dagger', weight: 1 },
    { name: 'Bolsa de componentes', icon: 'Pouch' },
    {
      name: 'Poción de curación',
      icon: 'POT Potion of Healing',
      qty: 1,
      rarity: 'common',
    },
    { name: 'Tinta y pluma', icon: 'Pouch A' },
    { name: 'Carta de un colega de Gnomengarde', icon: 'Scroll' },
    { name: 'Raciones', icon: 'Camp Supply Sack', qty: 5 },
    { name: 'Capa de viaje', icon: 'Cloak', equipped: true },
    { name: 'Lupa', icon: 'Magnifying Glass' },
  ],
  coins: { pp: 0, gp: 10, ep: 0, sp: 5, cp: 0 },
  features: [
    {
      name: 'Lanzamiento de conjuros',
      text: 'Inteligencia. CD 13, ataque +5. Dos espacios de nivel 1.',
    },
    {
      name: 'Recuperación arcana',
      text: 'Tras un descanso corto, recupera un espacio de conjuro de nivel 1. Una vez al día.',
    },
    { name: 'Visión en la oscuridad', text: '18 metros.' },
    {
      name: 'Ascendencia feérica',
      text: 'Ventaja contra encantamiento; la magia no puede dormirte.',
    },
    {
      name: 'Investigadora',
      text: 'Sabes dónde y a quién preguntar para encontrar información.',
    },
  ],
  spells: {
    cantrips: ['Rayo de escarcha', 'Mano de mago', 'Luz'],
    prepared: ['Proyectil mágico', 'Escudo', 'Dormir', 'Detectar magia'],
    slots: 2,
  },
  proficiencies: ['Daga', 'Dardo', 'Honda', 'Bastón', 'Ballesta ligera'],
  languages: ['Común', 'Élfico', 'Gnomo', 'Dracónico'],
  traits:
    'Uso palabras largas cuando las cortas servirían. Estoy convencida de que la gente siempre quiere oír lo que sé.',
  ideals: 'Conocimiento. El camino al poder pasa por entender.',
  bonds:
    'He estado buscando un libro que alguien robó de mi biblioteca. Lo encontraré.',
  flaws:
    'La mayoría de la gente grita y corre cuando ve un demonio. Yo me paro a tomar notas.',
  portraitId: 'portraits/pc/emberfemaleelfwitch',
  pitch:
    'La chispa. Frágil de cuerpo, letal a distancia y la única que ha leído el manual.',
  strengths: ['Conjuros', 'Arcanos', 'Investigar'],
  backstory:
    'Ciento doce años y la sensación de haber empezado tarde. Sariel se formó en Candlekeep copiando tratados de otros hasta que decidió que prefería escribir los suyos. Lleva un cuaderno para todo: lo que ve, lo que oye, lo que sospecha. Tiene una paciencia infinita para los enigmas y ninguna para los necios.\n\nHabla poco de su familia en el Bosque Alto y menos de por qué se fue. En combate cuenta hasta tres antes de lanzar, porque una vez no lo hizo. Se sorprende a sí misma preocupándose por gente que hace un mes no conocía, y no le gusta admitirlo.',
  hook: 'Durante dos años ha mantenido correspondencia con Fibblestib, un gnomo inventor de Gnomengarde que aseguraba haber construido «una máquina que dobla el tiempo». Las cartas se cortaron hace cuatro semanas. La última decía: «Hay algo en las cuevas que no es de aquí. No se lo he dicho a nadie». Sariel ha venido a Phandalin porque es lo más cerca de Gnomengarde que llega un carro.',
};

const corran: CharacterPreset = {
  id: 'corran',
  name: 'Corran Dosríos',
  shortName: 'Corran',
  race: 'Semielfo',
  raceTag: 'half-elf',
  gender: 'male',
  className: 'Explorador',
  classTag: 'ranger',
  level: 1,
  background: 'Forastero',
  alignment: 'Neutral',
  xp: 0,
  scores: { str: 12, dex: 17, con: 14, int: 10, wis: 15, cha: 10 },
  saveProficiencies: ['str', 'dex'],
  skillProficiencies: [
    'animal-handling',
    'athletics',
    'nature',
    'perception',
    'stealth',
    'survival',
  ],
  armorClass: 14,
  armorNote: 'Armadura de cuero',
  speed: 30,
  hp: { max: 12, current: 12, temp: 0 },
  hitDie: '1d10',
  attacks: [
    {
      name: 'Arco largo',
      bonus: 5,
      damage: '1d8+3 perforante',
      notes: 'Alcance 150/600',
    },
    {
      name: 'Espada corta',
      bonus: 5,
      damage: '1d6+3 perforante',
      notes: 'Ligera',
    },
    {
      name: 'Segunda espada corta',
      bonus: 5,
      damage: '1d6 perforante',
      notes: 'Ataque adicional',
    },
  ],
  inventory: [
    { name: 'Arco largo', icon: 'Longbow', equipped: true, weight: 2 },
    { name: 'Flechas', icon: 'Arrow of Ilmater', qty: 40 },
    {
      name: 'Espada corta',
      icon: 'Shortsword',
      qty: 2,
      equipped: true,
      weight: 2,
    },
    {
      name: 'Armadura de cuero',
      icon: 'Leather Armour',
      equipped: true,
      weight: 10,
    },
    { name: 'Trampa para caza', icon: 'Trap Disarm Toolkit' },
    { name: 'Colmillo de lobo (trofeo)', icon: 'Worg Fang' },
    {
      name: 'Poción de curación',
      icon: 'POT Potion of Healing',
      qty: 1,
      rarity: 'common',
    },
    { name: 'Raciones', icon: 'Camp Supply Sack', qty: 10 },
    { name: 'Cuerda', icon: 'Rope' },
    { name: 'Manta', icon: 'Clothes' },
  ],
  coins: { pp: 0, gp: 10, ep: 0, sp: 0, cp: 0 },
  features: [
    {
      name: 'Enemigo predilecto: dragones',
      text: 'Ventaja en Supervivencia para rastrearlos y en Inteligencia para recordar información sobre ellos.',
    },
    {
      name: 'Explorador nato: bosques',
      text: 'En bosques no te pierdes, viajas sin penalización y encuentras el doble de comida.',
    },
    { name: 'Visión en la oscuridad', text: '18 metros.' },
    {
      name: 'Andarríos',
      text: 'Recuerdas la disposición del terreno y encuentras comida y agua para seis personas al día.',
    },
  ],
  proficiencies: [
    'Armadura ligera y media',
    'Escudos',
    'Armas sencillas y marciales',
    'Kit de herbolario',
    'Flauta',
  ],
  languages: ['Común', 'Élfico', 'Dracónico'],
  traits:
    'Observo antes de hablar. Siento un profundo respeto por la naturaleza y muy poco por las ciudades.',
  ideals: 'Gloria. Hay que hacer algo grande para que te recuerden.',
  bonds: 'Un dragón blanco quemó el valle donde crecí. Le debo una a esa cosa.',
  flaws:
    'Recuerdo cada insulto que me han hecho y guardo rencor a quien me lo hizo.',
  portraitId: 'portraits/pc/ekun',
  pitch:
    'El rastreador. Ve primero, dispara mejor y conoce cada sendero al sur de Neverwinter.',
  strengths: ['Arco', 'Rastrear', 'Supervivencia'],
  backstory:
    'Hijo de una guardabosques humana y de un elfo que se fue antes de que aprendiera su nombre, Corran creció entre Umbrage Hill y el Bosque de Neverwinter, más cerca de los lobos que de la gente. La partera de la colina, Adabra Gwynn, le sacó dos flechas y una fiebre cuando era niño; él le lleva leña cada invierno desde entonces.\n\nHabla con los animales más que con las personas, y con las personas solo cuando merece la pena. Hace un mes vio la sombra del dragón cruzar el valle, y al día siguiente la casa de su madre era hielo y ceniza. No encontraron el cuerpo. Desde entonces no ha dormido dos noches en el mismo sitio.',
  hook: 'Conoce Umbrage Hill, a Adabra y el molino como la palma de su mano, y sabe que el dragón duerme de día en la cima del Pico Escarcha porque lo ha seguido tres veces hasta la nieve. No ha subido más porque no es idiota. Todavía. Ha venido a Phandalin por la recompensa del Alcaide, y porque solo no llega.',
};

const thokk: CharacterPreset = {
  id: 'thokk',
  name: 'Thokk Grancolmillo',
  shortName: 'Thokk',
  race: 'Semiorco',
  raceTag: 'half-orc',
  gender: 'male',
  className: 'Bárbaro',
  classTag: 'barbarian',
  level: 1,
  background: 'Artesano gremial (carretero)',
  alignment: 'Caótico bueno',
  xp: 0,
  scores: { str: 17, dex: 14, con: 16, int: 8, wis: 12, cha: 10 },
  saveProficiencies: ['str', 'con'],
  skillProficiencies: ['athletics', 'intimidation', 'insight', 'persuasion'],
  armorClass: 15,
  armorNote: 'Sin armadura (Defensa sin armadura)',
  speed: 30,
  hp: { max: 15, current: 15, temp: 0 },
  hitDie: '1d12',
  attacks: [
    {
      name: 'Hacha a dos manos',
      bonus: 5,
      damage: '1d12+3 cortante',
      notes: 'Pesada, a dos manos',
    },
    {
      name: 'Hacha de mano',
      bonus: 5,
      damage: '1d6+3 cortante',
      notes: 'Arrojadiza 20/60',
    },
    {
      name: 'Jabalina',
      bonus: 5,
      damage: '1d6+3 perforante',
      notes: 'Alcance 30/120',
    },
  ],
  inventory: [
    { name: 'Hacha a dos manos', icon: 'Greataxe', equipped: true, weight: 7 },
    { name: 'Hacha de mano', icon: 'Handaxe', qty: 2, weight: 2 },
    { name: 'Jabalina', icon: 'Javelin', qty: 4, weight: 2 },
    {
      name: 'Herramientas de carretero',
      icon: 'Item LOOT Foundry Misc Crowbar A',
    },
    { name: 'Carta del gremio', icon: 'Scroll' },
    {
      name: 'Poción de curación',
      icon: 'POT Potion of Healing',
      qty: 1,
      rarity: 'common',
    },
    { name: 'Raciones', icon: 'Camp Supply Sack', qty: 10 },
    { name: 'Odre', icon: 'Iron Flask' },
    { name: 'Manta de lana', icon: 'Clothes' },
    { name: 'Rueda de queso de Triboar', icon: 'FOOD Durinbold Cheese Wheel' },
  ],
  coins: { pp: 0, gp: 15, ep: 0, sp: 0, cp: 0 },
  features: [
    {
      name: 'Furia',
      text: 'Acción adicional: +2 al daño cuerpo a cuerpo, ventaja en Fuerza, resistencia a daño físico. Dos veces por descanso largo.',
    },
    {
      name: 'Defensa sin armadura',
      text: 'CA = 10 + Destreza + Constitución sin armadura.',
    },
    {
      name: 'Aguante implacable',
      text: 'Si caes a 0 PV, quedas a 1 PV en su lugar. Una vez por descanso largo.',
    },
    {
      name: 'Ataques salvajes',
      text: 'En un crítico cuerpo a cuerpo, tira un dado de daño adicional.',
    },
    { name: 'Visión en la oscuridad', text: '18 metros.' },
  ],
  proficiencies: [
    'Armadura ligera y media',
    'Escudos',
    'Armas sencillas y marciales',
    'Herramientas de carretero',
  ],
  languages: ['Común', 'Orco'],
  traits:
    'Me gusta el trabajo bien hecho, y una pelea bien hecha es un trabajo. Perdono rápido y olvido lento.',
  ideals: 'Comunidad. Todos tenemos que arrimar el hombro.',
  bonds: 'La caravana era mi familia. Encontraré lo que quede de ella.',
  flaws:
    'Cuando me enfado, dejo de escuchar. Y me enfado cuando alguien toca a los míos.',
  portraitId: 'portraits/pc/regongar',
  pitch:
    'La avalancha. Más vida que nadie, más daño que nadie y un corazón del tamaño del hacha.',
  strengths: ['Daño', 'Puntos de golpe', 'Fuerza'],
  backstory:
    'Thokk hacía ruedas en Triboar y las arreglaba por el camino: doce años de carretero en la caravana de los Halcón Rojo, la única familia que nunca le preguntó por su padre. Es grande, lento para hablar y rápido para reírse; los niños de la caravana se le subían encima como a un carro. Aprendió a pelear porque los caminos son largos y los bandidos también.\n\nHace tres semanas, en el Sendero de Triboar, una sombra blanca bajó del cielo. Thokk despertó bajo un carro volcado, con la cara quemada de frío y la caravana convertida en un cementerio de hielo. No encontró a todos. Sobre todo no encontró a Bela, la hija del maestro carretero, de nueve años.',
  hook: 'Los cuerpos que faltaban en la caravana eran demasiados para un dragón que come vacas. Thokk cree que alguien llegó después y se llevó lo que el dragón no mató. En Phandalin ha oído el nombre de los Capas Rojas y el de una banda de orcos al norte. Ha venido a preguntar. Con el hacha, si hace falta.',
};

const CHARACTER_PRESETS: CharacterPreset[] = [
  bram,
  nissa,
  dagna,
  sariel,
  corran,
  thokk,
];

const presetById = (id: string) => CHARACTER_PRESETS.find((c) => c.id === id);

export { CHARACTER_PRESETS, presetById };
export type { Attack, CharacterPreset, InventoryItem };
